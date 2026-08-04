/**
 * Location-based Time & Date Utility for IDS Pulse
 * Formats time, date, timezone abbreviations, and plant location labels 
 * based on plant location, customer address, or user context.
 */

export function resolvePlantTimeZoneAndLocation(plantOrLocationHint) {
  let locationLabel = 'Local Device Time';
  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Toronto';

  if (plantOrLocationHint) {
    const hint = String(plantOrLocationHint).toLowerCase();

    // Ontario, Canada Plants (Eastern Time)
    if (hint.includes('oshawa') || hint.includes('belleville') || hint.includes('windsor') || hint.includes('brampton') || hint.includes('st. thomas') || hint.includes('oakville') || hint.includes('ontario') || hint.includes('autokabel') || hint.includes('magna') || hint.includes('stellantis')) {
      if (hint.includes('belleville')) locationLabel = 'Belleville Plant Time';
      else if (hint.includes('oshawa')) locationLabel = 'Oshawa Plant Time';
      else if (hint.includes('windsor')) locationLabel = 'Windsor Plant Time';
      else if (hint.includes('brampton')) locationLabel = 'Brampton Plant Time';
      else locationLabel = 'Ontario Plant Time';

      timeZone = 'America/Toronto';
    } 
    // US Michigan / Ohio Plants (Eastern Time)
    else if (hint.includes('detroit') || hint.includes('michigan') || hint.includes('toledo') || hint.includes('cleveland') || hint.includes('cami')) {
      if (hint.includes('detroit')) locationLabel = 'Detroit Plant Time';
      else locationLabel = 'Michigan Plant Time';

      timeZone = 'America/Detroit';
    } 
    // US Central Plants (Texas, Illinois, etc.)
    else if (hint.includes('texas') || hint.includes('arlington') || hint.includes('san antonio') || hint.includes('chicago') || hint.includes('illinois')) {
      if (hint.includes('arlington')) locationLabel = 'Arlington Plant Time';
      else if (hint.includes('texas')) locationLabel = 'Texas Plant Time';
      else locationLabel = 'Central Plant Time';

      timeZone = 'America/Chicago';
    }
  }

  // Fallback to browser timezone if no hint matched
  if (locationLabel === 'Local Device Time') {
    if (timeZone.includes('Toronto') || timeZone.includes('New_York') || timeZone.includes('Detroit')) {
      locationLabel = 'Ontario Plant Time';
      timeZone = 'America/Toronto';
    } else if (timeZone.includes('Chicago')) {
      locationLabel = 'Central Plant Time';
      timeZone = 'America/Chicago';
    } else if (timeZone.includes('Los_Angeles') || timeZone.includes('Vancouver')) {
      locationLabel = 'Pacific Plant Time';
      timeZone = 'America/Los_Angeles';
    } else {
      const city = timeZone.split('/')[1]?.replace(/_/g, ' ') || 'Local';
      locationLabel = `${city} Plant Time`;
    }
  }

  return { timeZone, locationLabel };
}

/**
 * Gets location-aware current time string, timezone abbreviation, and location label
 */
export function getFormattedLocationTime(dateObj = new Date(), locationHint = '') {
  const { timeZone, locationLabel } = resolvePlantTimeZoneAndLocation(locationHint);

  try {
    const timeString = dateObj.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const tzParts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone }).formatToParts(dateObj);
    const timeZoneAbbr = tzParts.find(p => p.type === 'timeZoneName')?.value || 'EST';

    return {
      timeString,
      timeZoneAbbr,
      locationLabel,
      timeZone
    };
  } catch (_err) {
    // Fallback if timezone string is invalid
    return {
      timeString: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timeZoneAbbr: 'EST',
      locationLabel: locationHint ? `${locationHint} Time` : 'Plant Time',
      timeZone: 'America/Toronto'
    };
  }
}

/**
 * Gets location-aware formatted date (YYYY-MM-DD)
 */
export function getFormattedLocationDate(dateObj = new Date(), locationHint = '') {
  const { timeZone } = resolvePlantTimeZoneAndLocation(locationHint);
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(dateObj);

    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  } catch (_err) {
    return dateObj.toISOString().split('T')[0];
  }
}
