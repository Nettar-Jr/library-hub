/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book, CirculationRecord, StudentSubmission, Announcement } from './types';

export const initialBooks: Book[] = [
  {
    id: 'book-1',
    title: 'Things Fall Apart',
    author: 'Chinua Achebe',
    isbn: '978-0385474542',
    category: 'African Literature',
    totalCopies: 10,
    availableCopies: 8,
    description: 'A classic novel chronicling pre-colonial life in the southeastern part of Nigeria and the arrival of Europeans during the late nineteenth century.',
    readsCount: 148,
    deweyClass: '800',
    deweyCode: '896.3'
  },
  {
    id: 'book-2',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0743273565',
    category: 'Classics',
    totalCopies: 5,
    availableCopies: 3,
    description: 'Set in the glamorous and decadent roaring twenties, this masterpiece tells the tragic story of the mysterious millionaire Jay Gatsby and his pursuit of Daisy Buchanan.',
    readsCount: 92,
    deweyClass: '800',
    deweyCode: '813.52'
  },
  {
    id: 'book-3',
    title: 'Percy Jackson & the Olympians: The Lightning Thief',
    author: 'Rick Riordan',
    isbn: '978-0786838653',
    category: 'Fantasy',
    totalCopies: 8,
    availableCopies: 5,
    description: 'Percy Jackson discovers he is a demigod son of Poseidon and is accused of stealing Zeus\'s master lightning bolt, embarking on a quest across America to find it.',
    readsCount: 184,
    deweyClass: '800',
    deweyCode: '813.6'
  },
  {
    id: 'book-4',
    title: 'The Secret Garden',
    author: 'Frances Hodgson Burnett',
    isbn: '978-0064401883',
    category: 'Children\'s Fiction',
    totalCopies: 6,
    availableCopies: 4,
    description: 'After losing her parents, Mary Lennox is sent to live in a dark mansion in Yorkshire, where she discovers a locked, hidden garden that changes her life forever.',
    readsCount: 65,
    deweyClass: '800',
    deweyCode: '823.8'
  },
  {
    id: 'book-5',
    title: 'Diary of a Wimpy Kid',
    author: 'Jeff Kinney',
    isbn: '978-0810993136',
    category: 'Humor / Children\'s',
    totalCopies: 12,
    availableCopies: 9,
    description: 'Follows Greg Heffley through the hilarious ups and downs of middle school, detailed in his private journal entries filled with comic drawings.',
    readsCount: 205,
    deweyClass: '800',
    deweyCode: '813.6'
  },
  {
    id: 'book-6',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '978-0553380163',
    category: 'Science & Cosmos',
    totalCopies: 4,
    availableCopies: 4,
    description: 'A landmark work by legendary physicist Stephen Hawking explaining the origin, structure, and ultimate fate of our universe in language accessible to all.',
    readsCount: 54,
    deweyClass: '500',
    deweyCode: '523.1'
  },
  {
    id: 'book-7',
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    isbn: '978-0262033848',
    category: 'Computer Science',
    totalCopies: 4,
    availableCopies: 3,
    description: 'A comprehensive and essential guide to the analysis and design of computer algorithms, utilized in senior computer science tracks.',
    readsCount: 45,
    deweyClass: '000',
    deweyCode: '005.1'
  },
  {
    id: 'book-8',
    title: 'The Republic',
    author: 'Plato',
    isbn: '978-0140455113',
    category: 'Philosophy',
    totalCopies: 3,
    availableCopies: 2,
    description: 'A seminal Socratic dialogue concerning justice, the order and character of the just city-state, and the ideal philosopher-king.',
    readsCount: 28,
    deweyClass: '100',
    deweyCode: '184'
  },
  {
    id: 'book-9',
    title: 'The Wealth of Nations',
    author: 'Adam Smith',
    isbn: '978-0553585971',
    category: 'Social Sciences',
    totalCopies: 5,
    availableCopies: 4,
    description: 'The fundamental treatise of classical political economy, discussing labor specialization, productivity, and free markets.',
    readsCount: 37,
    deweyClass: '300',
    deweyCode: '330.1'
  },
  {
    id: 'book-10',
    title: 'Architects of the Web: Engineering Breakthroughs',
    author: 'Robert H. Reid',
    isbn: '978-0471191871',
    category: 'Technology',
    totalCopies: 6,
    availableCopies: 5,
    description: 'Traces the technological revolution and applied engineering efforts that sparked the rise of the internet age.',
    readsCount: 71,
    deweyClass: '600',
    deweyCode: '604.2'
  },
  {
    id: 'book-11',
    title: 'A History of West Africa',
    author: 'A.D. Nzemeke',
    isbn: '978-9781234567',
    category: 'History',
    totalCopies: 8,
    availableCopies: 6,
    description: 'An expansive historical analysis of pre-colonial empires, kingdoms, trade routes, and modern West African development.',
    readsCount: 112,
    deweyClass: '900',
    deweyCode: '966'
  }
];

export const initialCirculation: CirculationRecord[] = [
  {
    id: 'loan-1',
    learnerName: 'Chidi Okafor (Year 9)',
    bookId: 'book-2',
    bookTitle: 'The Great Gatsby',
    borrowDate: '2026-06-15',
    dueDate: '2026-06-29',
    status: 'borrowed',
    alertSent: false,
  },
  {
    id: 'loan-2',
    learnerName: 'Amina Bello (Primary 5)',
    bookId: 'book-4',
    bookTitle: 'The Secret Garden',
    borrowDate: '2026-06-05',
    dueDate: '2026-06-19',
    status: 'overdue',
    alertSent: true,
  },
  {
    id: 'loan-3',
    learnerName: 'Tunde Williams (Year 11)',
    bookId: 'book-1',
    bookTitle: 'Things Fall Apart',
    borrowDate: '2026-05-10',
    dueDate: '2026-05-24',
    returnDate: '2026-05-23',
    status: 'returned',
    alertSent: false,
  },
  {
    id: 'loan-4',
    learnerName: 'Sarah J. (Primary 4)',
    bookId: 'book-3',
    bookTitle: 'Percy Jackson & the Olympians: The Lightning Thief',
    borrowDate: '2026-06-20',
    dueDate: '2026-07-04',
    status: 'borrowed',
    alertSent: false,
  }
];

export const initialSubmissions: StudentSubmission[] = [
  {
    id: 'sub-1',
    authorName: 'Tunde Williams',
    gradeOrYear: 'Year 11',
    title: 'The Midnight Chronicles: A Mystery in Lagos',
    category: 'short-story',
    content: `The city never sleeps, but on this particular Tuesday, the silence in the library was deafening. Outside, the headlights of yellow Danfo buses painted long, golden streaks on the rain-slicked asphalt of Broad Street. Inside, Tunde sat hidden behind a mountain of encyclopedias.

He was waiting for the clock to strike midnight. The legends at Premier International said that at midnight, the old leather-bound volume on the highest shelf of Section D would emit a soft, cerulean glow. It was rumored to hold the secrets of the school's founders, and more importantly, the clue to the lost colonial pocketwatch.

As the heavy brass hands of the grandfather clock ticked toward twelve, Tunde held his breath. Then, a click. The lights flickered. On shelf 14, a crack of brilliant blue light burst through the dust...`,
    createdAt: '2026-06-25T14:30:00Z',
    status: 'approved',
    likesCount: 24,
    comments: [
      {
        id: 'c-1',
        authorName: 'Chidi Okafor',
        content: 'This is brilliant, Tunde! I literally felt the tension. When is chapter 2 coming?',
        createdAt: '2026-06-25T16:00:00Z'
      },
      {
        id: 'c-2',
        authorName: 'Librarian Alabi',
        content: 'Superb narrative writing, Tunde. Your vocabulary is outstanding. Keep writing!',
        createdAt: '2026-06-26T09:12:00Z'
      }
    ]
  },
  {
    id: 'sub-2',
    authorName: 'Sarah J.',
    gradeOrYear: 'Primary 4',
    title: 'The Rain on the Zinc Roof',
    category: 'poetry',
    content: `Drumming, rhythmic, loud and clear,
A melody only the young can hear.
It starts with a patter, a warning, a tap,
Then rumbles and rolls like a thunderous clap.

The sky turns heavy, a blanket of grey,
Washing the heat of the long afternoon away.
Under the metal, we gather and listen,
As puddles outside begin to glisten.

It speaks of old rivers, of oceans so deep,
Singing the restless earth right back to sleep.`,
    createdAt: '2026-06-28T09:15:00Z',
    status: 'approved',
    likesCount: 56,
    comments: [
      {
        id: 'c-3',
        authorName: 'Amina Bello',
        content: 'I love this poem! It sounds just like my house during the rainy season.',
        createdAt: '2026-06-28T11:45:00Z'
      }
    ]
  },
  {
    id: 'sub-3',
    authorName: 'Leo Chen',
    gradeOrYear: 'Year 8',
    title: 'Future Premier School 2050',
    category: 'digital-art',
    content: 'An architectural vision of our beloved Premier International School twenty-four years into the future. It depicts eco-domes, hovering learning modules, and solar-active panels integrated into the brickwork, harmonizing old-school aesthetics with futuristic green technologies.',
    imageUrl: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80&w=600',
    createdAt: '2026-06-27T11:00:00Z',
    status: 'approved',
    likesCount: 89,
    comments: []
  },
  {
    id: 'sub-4',
    authorName: 'Fatima Musa',
    gradeOrYear: 'Year 12',
    title: 'An Analysis of Climate Policy in West Africa',
    category: 'academic-essay',
    content: `Climate change presents an existential challenge to the ecological and macroeconomic stability of the West African sub-region. While national frameworks like Nigeria's Climate Change Act (2021) set ambitious carbon reduction targets, structural bottlenecks—specifically sub-optimal financing and enforcement deficits—undermine execution.

This paper assesses the efficacy of localized adaptation strategies in agricultural sectors, comparing the top-down initiatives with decentralized community-led forestry in Ghana and Senegal. We argue that sustainable resilience is highly correlated with community-level asset ownership rather than large-scale, externally managed infrastructure project intervention...`,
    createdAt: '2026-06-29T16:45:00Z',
    status: 'approved',
    likesCount: 18,
    comments: [
      {
        id: 'c-4',
        authorName: 'Mr. Gabriel (English & Gov)',
        content: 'A thoroughly researched and maturely formulated treatise, Fatima. The comparative analysis is highly persuasive.',
        createdAt: '2026-06-30T08:30:00Z'
      }
    ]
  },
  // Pending submissions for user to play with in librarian moderation workflow
  {
    id: 'sub-5',
    authorName: 'Amina Bello',
    gradeOrYear: 'Primary 5',
    title: 'Whispers of the Savannah',
    category: 'poetry',
    content: `Golden grass dancing in the dry harmattan wind,
Leaving all the dust and memories behind.
The baobab stands like a wise old king,
Waiting to hear what the morning birds will sing.

Shadows of gazelles leap over the plain,
Praying to the sky for the first sweet rain.`,
    createdAt: '2026-07-01T10:20:00Z',
    status: 'pending',
    likesCount: 0,
    comments: []
  },
  {
    id: 'sub-6',
    authorName: 'Kojo Mensah',
    gradeOrYear: 'Year 9',
    title: 'The Cosmic Canvas of Dreams',
    category: 'digital-art',
    content: 'This artwork blends digital oil painting and astronomical telemetry designs to represent how young students dream of space exploration and finding their own creative stars in the heavens.',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
    createdAt: '2026-07-01T14:50:00Z',
    status: 'pending',
    likesCount: 0,
    comments: []
  }
];

export const initialAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Annual Literacy Week: Book Review Submissions Open!',
    content: 'We are thrilled to launch this year\'s Literacy Week! Students from all grades are invited to submit critical reviews of their favorite books. The top 3 reviews will win Amazon Kindle readers and custom star badges in the gallery.',
    date: '2026-06-30',
    category: 'info',
  },
  {
    id: 'ann-2',
    title: 'Overdue Books Return Window (No Penalty)',
    content: 'Librarian Alabi has declared an Amnesty Week! All books returned by July 10th will have outstanding overdue flags cleared with zero fines or library suspension. Please check your desks and backpacks.',
    date: '2026-06-29',
    category: 'alert',
  },
  {
    id: 'ann-3',
    title: 'Congratulations to Sarah J. (Poet of the Month!)',
    content: 'A huge round of applause to Sarah J. in Primary 4! Her poem "The Rain on the Zinc Roof" received over 50 likes in our school gallery and was selected by our English Department as the top piece this week.',
    date: '2026-06-28',
    category: 'achievement',
  }
];
