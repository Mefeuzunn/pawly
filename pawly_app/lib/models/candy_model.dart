import 'package:flutter/material.dart';

class CandyItem {
  final String id;
  final String message;
  final String sender;
  final Color color;
  final DateTime timestamp;
  double x;
  double y;
  double vx;
  double vy;
  double radius;

  CandyItem({
    required this.id,
    required this.message,
    required this.sender,
    required this.color,
    DateTime? timestamp,
    this.x = 0,
    this.y = 0,
    this.vx = 0,
    this.vy = 0,
    this.radius = 16.0,
  }) : timestamp = timestamp ?? DateTime.now();
}
