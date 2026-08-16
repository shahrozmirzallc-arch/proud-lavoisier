// mobile_flutter/lib/models/user_profile.dart

class UserProfile {
  final String id;
  final String name;
  final String username;
  final String email;
  final String role; // 'rep', 'admin', 'customer'
  final String? supplierId;
  final String? plantId;
  final String? title;
  final String? payCurrency; // 'CAD', 'USD'

  UserProfile({
    required this.id,
    required this.name,
    required this.username,
    required this.email,
    required this.role,
    this.supplierId,
    this.plantId,
    this.title,
    this.payCurrency = 'CAD',
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['username']?.toString() ?? 'Field Rep',
      username: json['username']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString().toLowerCase() ?? 'rep',
      supplierId: json['supplier_id']?.toString() ?? json['customer_id']?.toString(),
      plantId: json['plant_id']?.toString(),
      title: json['title']?.toString() ?? 'IDS Quality Field Inspector',
      payCurrency: json['pay_currency']?.toString() ?? 'CAD',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'email': email,
      'role': role,
      'supplier_id': supplierId,
      'plant_id': plantId,
      'title': title,
      'pay_currency': payCurrency,
    };
  }
}
