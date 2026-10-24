class CoupleModel {
  final String myName;
  final String partnerName;
  final String myAvatar;
  final String partnerAvatar;
  String myStatus;
  String partnerStatus;
  double distanceKm;
  int missYouCount;
  int todayMissYouCount;
  double mySleepHours;
  double partnerSleepHours;
  String dailyQuestion;
  String? myAnswer;
  String? partnerAnswer;
  bool isTogether;

  CoupleModel({
    this.myName = 'Müge',
    this.partnerName = 'Efe',
    this.myAvatar = '🌸',
    this.partnerAvatar = '🐻',
    this.myStatus = 'Antigravity ile kodluyor ✨',
    this.partnerStatus = 'Pawly oynuyor 🐾',
    this.distanceKm = 4.8,
    this.missYouCount = 1284,
    this.todayMissYouCount = 42,
    this.mySleepHours = 7.5,
    this.partnerSleepHours = 8.0,
    this.dailyQuestion = 'İlk karşılaştığımız gün en çok ne dikkatini çekmişti?',
    this.myAnswer = 'Gözlerin ve o tatlı gülüşün! 🥰',
    this.partnerAnswer = 'Harika enerjin ve samimiyetin ✨',
    this.isTogether = false,
  });

  void sendMissYou() {
    missYouCount++;
    todayMissYouCount++;
  }
}
