import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:kisan_dost_ai/main.dart';

void main() {
  testWidgets('App loads smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const KisanDostApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
