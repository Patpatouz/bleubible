import { Chapter, ReadingProgress, StudyPlan } from '../types';

export const mockProgress: ReadingProgress = {
  bookId: 'john',
  bookName: 'John',
  chapter: 3,
  percent: 75,
  lastRead: '2 hours ago'
};

export const mockChapter: Chapter = {
  bookId: 'john',
  bookName: 'John',
  number: 3,
  version: 'NIV',
  verses: [
    { number: 1, text: "Now there was a Pharisee, a man named Nicodemus who was a member of the Jewish ruling council." },
    { number: 2, text: "He came to Jesus at night and said, \"Rabbi, we know that you are a teacher who has come from God. For no one could perform the signs you are doing if God were not with him.\"" },
    { number: 3, text: "Jesus replied, \"Very truly I tell you, no one can see the kingdom of God unless they are born again.\"" },
    { number: 4, text: "\"How can someone be born when they are old?\" Nicodemus asked. \"Surely they cannot enter a second time into their mother's womb to be born!\"" },
    { number: 5, text: "Jesus answered, \"Very truly I tell you, no one can enter the kingdom of God unless they are born of water and the Spirit.\"" }
  ]
};

export const mockPlans: StudyPlan[] = [
  {
    id: '1',
    title: 'New Beginnings',
    durationDays: 7,
    level: 'Beginner',
    description: 'A 7-day plan to help you start fresh with God and build a deeper daily connection through His Word.',
    icon: 'Sun',
    tasks: [
      'Read John 1:1-18',
      'Morning Prayer',
      'Reflection: Who is Jesus?',
      'Evening Gratitude'
    ]
  },
  {
    id: '2',
    title: 'Strength in Trials',
    durationDays: 14,
    level: 'Intermediate',
    description: 'Find comfort and strength through scripture during difficult seasons of life.',
    icon: 'Shield',
    tasks: [
      'Read Psalm 23',
      'Meditate on James 1:2-4',
      'Journaling: Finding Peace',
      'Prayer for Strength'
    ]
  },
  {
    id: '3',
    title: 'Deep Dive: Romans',
    durationDays: 30,
    level: 'Advanced',
    description: 'An intensive study of Paul\'s letter to the Romans, exploring theology and grace.',
    icon: 'Zap',
    tasks: [
      'Read Romans 1-2',
      'Cross-reference study',
      'Theological analysis',
      'Personal application'
    ]
  }
];

export const verseOfTheDay = {
  text: "I can do all this through him who gives me strength.",
  reference: "Philippians 4:13 NIV",
  author: "Apostle Paul"
};
