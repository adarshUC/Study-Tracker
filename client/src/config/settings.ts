// Configurable settings for the app
export const APP_CONFIG = {
  // Daily Planner Settings
  DAILY_PLANNER: {
    COPY_FORMAT: {
      HEADER: "#Day_{dayNumber}   |  {date}   | streak {streak}",
      WOKE_UP_LINE: "------------- {woke_up:\"{wokeUp}\"} ---------------",
      SEPARATOR: "---------------------------------------------------------",
      TIME_FORMAT: "   (took {hours}hr {minutes}min.)",
      DAY_RATING_STARS: "★☆"
    },
    DEFAULT_WAKE_UP_TIME: "06:00",
    CATEGORIES: ["aaj ka kaam", "others"],
    REQUIRE_DAY_RATING_FOR_NEW_DAY: true
  },

  // Quotes for different sections
  QUOTES: {
    DAILY_PLANNER: [
      "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
      "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
      "The only way to do great work is to love what you do. - Steve Jobs",
      "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
      "The future depends on what you do today. - Mahatma Gandhi",
      "Success is the sum of small efforts repeated day in and day out. - Robert Collier",
      "It does not matter how slowly you go as long as you do not stop. - Confucius",
      "The expert in anything was once a beginner. - Helen Hayes",
      "Your limitation—it's only your imagination.",
      "Push yourself, because no one else is going to do it for you.",
      "Great things never come from comfort zones."
    ],
    STOPWATCH: [
      "Every Second Counts. Notice how much time you're giving to distractions/irrelevant things/actual goal",
      "Time is the most valuable thing we have and the easiest to waste.",
      "What we do today matters most.",
      "Every moment is a fresh beginning.",
      "Time is precious, but truth is more precious than time."
    ],
    TIMER: [
      "Every Second Counts for someone who really knows how valuable time is.",
      "Time management is life management.",
      "Focus on being productive instead of busy.",
      "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
      "Time is what we want most, but what we use worst."
    ],
    CALENDAR: [
      "Count your backlog here",
      "The two most important days in your life are the day you are born and the day you find out why.",
      "Yesterday is history, tomorrow is a mystery, today is a gift.",
      "Time flies over us, but leaves its shadow behind."
    ],
    TASK_DUMP: [
      "Be focused. Put other thoughts todo later",
      "The way to get started is to quit talking and begin doing.",
      "If you want to achieve greatness stop asking for permission.",
      "Innovation distinguishes between a leader and a follower.",
      "A year from now you may wish you had started today."
    ],
    ALARMS: [
      "Time is the most valuable thing we have. Use alarms to stay on track.",
      "A reminder at the right time can change everything.",
      "Discipline is remembering what you want.",
      "Success is about consistency, not perfection.",
      "The future depends on what you do today."
    ]
  },

  // Timer Settings
  TIMER: {
    DEFAULT_DURATION_MINUTES: 25,
    TEMPLATES: [
      { label: '10 Minutes', minutes: 10 },
      { label: '20 Minutes', minutes: 20 },
      { label: '30 Minutes', minutes: 30 },
      { label: '45 Minutes', minutes: 45 },
      { label: '90 Minutes', minutes: 90 }
    ],
    EYE_PROTECTION: {
      WORK_DURATION_MINUTES: 20,
      BREAK_DURATION_SECONDS: 20,
      AUTO_START: true,
      LOOP_BY_DEFAULT: true
    }
  },

  // App Settings
  APP: {
    TITLE_ONLINE: "Time Tracker",
    TITLE_OFFLINE: "Timer Tracker (Offline)",
    AUTO_SYNC_ON_RECONNECT: true,
    OFFLINE_SECTIONS: ['planner', 'stopwatch', 'timer', 'tasks', 'alarms'] // sections available offline
  },

  // Task Status Cycle
  TASK_STATUS_CYCLE: [
    'pending',     // 1st click
    'progress',    // 2nd click  
    'done',        // 3rd click
    'progress',    // 4th click
    'pending'      // 5th click (back to start)
  ]
};
