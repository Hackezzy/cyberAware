/**
 * Content for the MFA Simulator tool. Kept as data (not hardcoded in the
 * page) so the four methods stay easy to review/edit independently of the
 * page's rendering and interaction logic.
 */

export const MFA_METHODS = [
  {
    id: "sms",
    label: "SMS Code",
    securityLevel: "Weak",
    securityColorVar: "--color-danger",
    howItWorks: [
      "Enter your password",
      "A 6-digit code is texted to your phone",
      "Enter the code to finish logging in",
    ],
    attackTitle: "SIM swapping & SMS interception",
    attackDescription:
      "An attacker can convince (or bribe, or socially engineer) your phone carrier to transfer your number onto a SIM card they control — after that, your \"secure\" codes are texted straight to them, not you. SMS can also be intercepted through known weaknesses in the telephone network itself. It's also the exact method targeted by the vishing attack covered elsewhere on this site — a caller simply asking you to read the code back.",
  },
  {
    id: "authenticator",
    label: "Authenticator App",
    securityLevel: "Moderate",
    securityColorVar: "--color-warning",
    howItWorks: [
      "Enter your password",
      "Open your authenticator app",
      "Enter the 6-digit code shown, which changes every 30 seconds",
    ],
    attackTitle: "Real-time phishing relay",
    attackDescription:
      "A fake login page can capture your password and your current authenticator code the instant you type them, then immediately relay both to the real site before the code expires. The code being generated on your own device doesn't help if you've been tricked into typing it into a fake site in the first place — it's still phishable, just harder to intercept after the fact than SMS.",
  },
  {
    id: "push",
    label: "Push Notification",
    securityLevel: "Moderate",
    securityColorVar: "--color-warning",
    howItWorks: [
      "Enter your password",
      "A notification appears on your phone: \"Approve this login?\"",
      "Tap Approve",
    ],
    attackTitle: "MFA fatigue (\"push bombing\")",
    attackDescription:
      "An attacker who already has your password can trigger login attempts repeatedly, flooding your phone with approval requests — sometimes for hours, sometimes late at night. The goal isn't to guess anything; it's to wear you down until you tap \"Approve\" just to make the notifications stop, or mistake it for a glitch. This exact technique has been used in several real, high-profile breaches.",
  },
  {
    id: "hardware",
    label: "Hardware Key / Passkey",
    securityLevel: "Strongest",
    securityColorVar: "--color-safe",
    howItWorks: [
      "Enter your password (or nothing at all, with a passwordless passkey)",
      "Tap or insert a physical security key, or use your device's built-in biometric",
      "The key cryptographically proves both who you are and which real site you're on",
    ],
    attackTitle: "Why this one is phishing-resistant",
    attackDescription:
      "A hardware key checks the website's real domain as part of its cryptographic handshake — if you're tricked onto a lookalike phishing domain, the key simply refuses to respond, even if you personally believe the page is real. There's no code to read out, relay, or intercept. The main realistic risk is someone physically stealing the key itself and also somehow knowing your password.",
  },
];
