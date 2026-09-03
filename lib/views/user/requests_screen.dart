// lib/views/user/requests_screen.dart
import 'package:flutter/material.dart';

class RequestsScreen extends StatelessWidget {
  const RequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        'My Requests / میری درخواستیں',
        style: Theme.of(context).textTheme.headlineMedium,
      ),
    );
  }
}
