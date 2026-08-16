// tests/user_lifecycle_crud_gate.test.js
// Authoritative User Lifecycle CRUD & Super-Admin Protection Gate

import { describe, it, expect, beforeEach } from 'vitest';

// Browser global polyfills for Node / Vitest
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    get length() { return store.size; }
  };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

import {
  addUser,
  provisionUser,
  updateUser,
  deleteUser,
  deleteEntity,
  getEntities,
  saveEntity
} from '../src/components/SharedDatabase.js';

describe('User Lifecycle CRUD & Security Protection Suite', () => {
  beforeEach(() => {
    localStorage.clear();

    // Seed core protected users
    saveEntity('users', {
      id: 'user_shahroz',
      username: 'shahroz',
      email: 'shahroz@integritydrivensolutions.ca',
      password: 'Shahroz121$',
      role: 'admin',
      name: 'Shahroz Mirza'
    });

    saveEntity('users', {
      id: 'user_donna',
      username: 'donna',
      email: 'donna@integritydrivensolutions.ca',
      password: 'Donna1234$',
      role: 'admin',
      name: 'Donna Cabral'
    });

    saveEntity('users', {
      id: 'user_greg',
      username: 'greg',
      email: 'greg@integritydrivensolutions.ca',
      password: 'Greg1234$',
      role: 'admin',
      name: 'Greg'
    });

    saveEntity('users', {
      id: 'user_colleen',
      username: 'colleen',
      email: 'colleen@integritydrivensolutions.ca',
      password: 'Colleen1234$',
      role: 'admin',
      name: 'Colleen Boyd'
    });
  });

  it('1. User Creation Gate — successfully provisions a new Field Rep with unique email and generated password', () => {
    const payload = {
      name: 'Alex Inspector',
      email: 'alex.inspector@integritydrivensolutions.ca',
      role: 'rep',
      plant_id: 'plant_oakville',
      pay_rate: 28.50,
      pay_currency: 'CAD'
    };

    const result = provisionUser(payload);

    expect(result.user).toBeDefined();
    expect(result.user.name).toBe('Alex Inspector');
    expect(result.user.email).toBe('alex.inspector@integritydrivensolutions.ca');
    expect(result.user.role).toBe('rep');
    expect(result.user.pay_rate).toBe(28.50);
    expect(result.user.pay_currency).toBe('CAD');
    expect(result.tempPassword.length).toBeGreaterThanOrEqual(8);

    // Verify persisted in DB
    const users = getEntities('users');
    expect(users.some(u => u.email === 'alex.inspector@integritydrivensolutions.ca')).toBe(true);
  });

  it('2. Duplicate Email Gate — blocks creation of accounts with duplicate email addresses', () => {
    const payload = {
      name: 'Duplicate Donna',
      email: 'donna@integritydrivensolutions.ca',
      role: 'rep'
    };

    expect(() => provisionUser(payload)).toThrow(/already exists for email/i);
  });

  it('3. User Update Gate — allows updating phone, rate, and plant assignments for active staff', () => {
    // Add a rep first
    const rep = addUser({
      name: 'Marcus Quality',
      email: 'marcus@integritydrivensolutions.ca',
      password: 'Marcus1234$',
      role: 'rep',
      phone: '519-555-0100'
    });

    const updated = updateUser(rep.id, {
      phone: '519-555-9999',
      plant_id: 'plant_windsor',
      pay_rate: 32.00
    });

    expect(updated.phone).toBe('519-555-9999');
    expect(updated.plant_id).toBe('plant_windsor');
    expect(updated.pay_rate).toBe(32.00);

    // Verify in database
    const users = getEntities('users');
    const inDb = users.find(u => u.id === rep.id);
    expect(inDb.phone).toBe('519-555-9999');
  });

  it('4. Super-Admin Protection Gate (Hard Rule 7) — blocks downgrading or overwriting Shahroz Mirza credentials', () => {
    // Attempting to downgrade role
    expect(() => updateUser('shahroz', { role: 'rep' })).toThrow(/unalterable/i);

    // Attempting to alter locked password
    expect(() => updateUser('shahroz', { password: 'HackedPassword123' })).toThrow(/Rule 7/i);
  });

  it('5. User Deletion Gate — safely deletes non-protected users from database', () => {
    const tempRep = addUser({
      name: 'Temporary Worker',
      email: 'temp.worker@integritydrivensolutions.ca',
      password: 'Temp1234$',
      role: 'rep'
    });

    const deleteResult = deleteUser(tempRep.id);
    expect(deleteResult.success).toBe(true);

    // Verify removed from database
    const users = getEntities('users');
    expect(users.some(u => u.id === tempRep.id)).toBe(false);
  });

  it('6. Protected Admin Deletion Gate — permanently blocks deleting core admin accounts (shahroz, donna, greg, colleen)', () => {
    expect(() => deleteUser('shahroz')).toThrow(/Protected system user "shahroz" cannot be deleted/i);
    expect(() => deleteUser('donna')).toThrow(/Protected system user "donna" cannot be deleted/i);
    expect(() => deleteUser('greg')).toThrow(/Protected system user "greg" cannot be deleted/i);
    expect(() => deleteUser('colleen')).toThrow(/Protected system user "colleen" cannot be deleted/i);
  });

  it('7. Universal deleteEntity Gate — routes user deletion safely through deleteUser', () => {
    const clientUser = addUser({
      name: 'Client Test User',
      email: 'client.test@supplier.com',
      password: 'Client1234$',
      role: 'customer',
      supplier_id: 'sup_test'
    });

    deleteEntity('users', clientUser.id);

    const users = getEntities('users');
    expect(users.some(u => u.id === clientUser.id)).toBe(false);
  });
});
