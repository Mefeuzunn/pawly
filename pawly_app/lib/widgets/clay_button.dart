import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';
import '../core/theme/app_typography.dart';
import '../core/utils/haptics.dart';

class ClayButton extends StatefulWidget {
  final String text;
  final Widget? icon;
  final VoidCallback onTap;
  final Color color;
  final Color textColor;
  final double height;
  final double radius;

  const ClayButton({
    super.key,
    required this.text,
    this.icon,
    required this.onTap,
    this.color = AppColors.primary,
    this.textColor = Colors.white,
    this.height = 52,
    this.radius = 24,
  });

  @override
  State<ClayButton> createState() => _ClayButtonState();
}

class _ClayButtonState extends State<ClayButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) {
        setState(() => _isPressed = true);
        AppHaptics.lightImpact();
      },
      onTapUp: (_) {
        setState(() => _isPressed = false);
      },
      onTapCancel: () {
        setState(() => _isPressed = false);
      },
      onTap: () {
        AppHaptics.mediumImpact();
        widget.onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeOutQuad,
        height: widget.height,
        transform: Matrix4.translationValues(0.0, _isPressed ? 4.0 : 0.0, 0.0)
          ..multiply(Matrix4.diagonal3Values(_isPressed ? 0.96 : 1.0, _isPressed ? 0.96 : 1.0, 1.0)),
        decoration: AppTheme.clayButton(
          color: widget.color,
          radius: widget.radius,
          pressed: _isPressed,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (widget.icon != null) ...[
              widget.icon!,
              const SizedBox(width: 8),
            ],
            Text(
              widget.text,
              style: AppTypography.button.copyWith(color: widget.textColor),
            ),
          ],
        ),
      ),
    );
  }
}
