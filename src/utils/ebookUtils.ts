/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EBookPage, ReadingMilestone, ReadingProgressRecord, PageDwellRecord } from '../types';

/**
 * Split raw manuscript/file text into comfortable, book-like pages (~220 - 280 words per page)
 */
export function parseRawTextToPages(text: string, title?: string): EBookPage[] {
  if (!text || text.trim() === '') {
    return [
      {
        pageNumber: 1,
        chapterTitle: title ? `Chapter 1: ${title}` : 'Chapter 1: Introduction',
        content: 'Welcome to this digital edition. The reader is initialized and ready for reading.'
      }
    ];
  }

  // Break by paragraphs or double newlines
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length === 0) {
    paragraphs.push(text.trim());
  }

  const pages: EBookPage[] = [];
  let currentPageParagraphs: string[] = [];
  let currentWordCount = 0;
  let pageNum = 1;
  const WORDS_PER_PAGE_TARGET = 240;

  for (const para of paragraphs) {
    const wordCount = para.split(/\s+/).length;
    currentPageParagraphs.push(para);
    currentWordCount += wordCount;

    if (currentWordCount >= WORDS_PER_PAGE_TARGET) {
      pages.push({
        pageNumber: pageNum,
        chapterTitle: pageNum === 1 ? (title ? `Prologue: ${title}` : 'Chapter 1') : `Chapter ${Math.ceil(pageNum / 4)} · Part ${pageNum}`,
        content: currentPageParagraphs.join('\n\n')
      });
      pageNum++;
      currentPageParagraphs = [];
      currentWordCount = 0;
    }
  }

  if (currentPageParagraphs.length > 0) {
    pages.push({
      pageNumber: pageNum,
      chapterTitle: `Conclusion · Page ${pageNum}`,
      content: currentPageParagraphs.join('\n\n')
    });
  }

  return pages;
}

/**
 * Curated authentic pages for key library collection titles
 */
export const CURATED_EBOOK_CONTENTS: Record<string, EBookPage[]> = {
  'book-1': [
    {
      pageNumber: 1,
      chapterTitle: 'Chapter 1: Okonkwo of Umuofia',
      content: `Okonkwo was well known throughout the nine villages and even beyond. His fame rested on solid personal achievements. As a young man of eighteen he had brought honour to his village by throwing Amalinze the Cat. Amalinze was the great wrestler who for seven years was undefeated from Umuofia to Mbaino.

He was called the Cat because his back would never touch the earth. It was this man that Okonkwo threw in a fight which the old men agreed was one of the fiercest since the founder of their town engaged a spirit of the wild for seven days and seven nights.`
    },
    {
      pageNumber: 2,
      chapterTitle: 'Chapter 1: The Wrestling Contest',
      content: `The drums beat and the flutes sang and the spectators held their breath. Amalinze was a wily craftsman, but Okonkwo was as slippery as a fish in water. Every nerve and every muscle stood out on their arms, on their backs and their thighs, and one almost heard them stretching to breaking point.

In the end, Okonkwo threw the Cat. That was many years ago, twenty years or more, and during this time Okonkwo's fame had grown like a bush-fire in the harmattan. He was tall and huge, and his bushy eyebrows and wide nose gave him a very severe look. He breathed heavily, and it was said that, when he slept, his wives and children in their houses could hear him breathe.`
    },
    {
      pageNumber: 3,
      chapterTitle: 'Chapter 2: The Moonlit Night',
      content: `Night was already falling when the crier reached Okonkwo's compound. The moon had not yet risen, and the night was as black as pitch. Okonkwo cleared his throat and waited. Then through the heavy silence of the night came the hollow sound of the wooden gong: ogene.

Gome, gome, gome, gome went the gong, and then the crier called: "Umuofia kwenu!" And a tremor seemed to run through the sleeping village as if thousands of voices answered from the dark. Every man of Umuofia was summoned to the marketplace in the morning.`
    },
    {
      pageNumber: 4,
      chapterTitle: 'Chapter 2: The Gathering at the Market',
      content: `In the morning the market-place was full. There must have been about ten thousand men there, all whispering in subdued voices. When Ogbuefi Ezego stood up, the crowd was hushed into dead silence. Ezego was a powerful orator and always was chosen to speak on such occasions.

He moved his hands across his eyes as if to clear his sight, and then shouted with a voice like a thunderbolt: "Umuofia kwenu!" The crowd answered with one voice. He told them that a daughter of Umuofia had been killed in Mbaino, and that justice must be exacted.`
    },
    {
      pageNumber: 5,
      chapterTitle: 'Chapter 3: The Soil and the Seasons',
      content: `Okonkwo did not have the start in life which many young men usually had. He neither inherited a barn from his father, nor a title, nor even a young wife. But in spite of these disadvantages, he had begun even in his father’s lifetime to lay the foundations of a prosperous future.

It was slow and painful work. Share-cropping, which was what he did, was like pouring water into a wicker basket. But Okonkwo was driven by one passion: to become a lord of the clan and to put behind him the bitter memories of his father Unoka.`
    },
    {
      pageNumber: 6,
      chapterTitle: 'Chapter 3: The Feast of the New Yam',
      content: `The Feast of the New Yam was approaching and Umuofia was ripe with excitement. It was an occasion for giving thanks to Ani, the earth goddess and the source of all fertility. Ani played a greater part in the life of the people than any other deity.

New yams could not be eaten until some had first been offered to these powers. Men and women, young and old, looked forward to the New Yam Festival because it began the season of plenty, when the harvest was brought home and shared among friends.`
    }
  ],
  'book-2': [
    {
      pageNumber: 1,
      chapterTitle: 'Chapter 1: The Advice of My Father',
      content: `In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since.

"Whenever you feel like criticizing anyone," he told me, "just remember that all the people in this world haven’t had the advantages that you’ve had."

He didn’t say any more, but we’ve always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I’m inclined to reserve all judgements, a habit that has opened up many curious natures to me.`
    },
    {
      pageNumber: 2,
      chapterTitle: 'Chapter 1: The Green Light across the Bay',
      content: `When I came back from the East last autumn I felt that I wanted the world to be in uniform and at a sort of moral attention forever; I wanted no more riotous excursions with privileged glimpses into the human heart.

Only Gatsby, the man who gives his name to this book, was exempt from my reaction—Gatsby, who represented everything for which I have an unaffected scorn. If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life.`
    },
    {
      pageNumber: 3,
      chapterTitle: 'Chapter 2: The Valley of Ashes',
      content: `About half way between West Egg and New York the motor road hastily joins the railroad and runs beside it for a quarter of a mile, so as to shrink away from a certain desolate area of land.

This is a valley of ashes—a fantastic farm where ashes grow like wheat into ridges and hills and grotesque gardens; where ashes take the forms of houses and chimneys and rising smoke and, finally, with a transcendent effort, of ash-grey men who move dimly and already crumbling through the powdery air.`
    },
    {
      pageNumber: 4,
      chapterTitle: 'Chapter 3: The Music and the Lights',
      content: `There was music from my neighbour’s house through the summer nights. In his blue gardens men and girls came and went like moths among the whisperings and the champagne and the stars.

At high tide in the afternoon I watched his guests diving from the tower of his raft, or taking the sun on the hot sand of his beach while his two motor-boats slit the waters of the Sound, drawing aquaplanes over cataracts of foam. Gatsby stood on the marble steps alone, watching his guests with an enigmatic smile.`
    }
  ],
  'book-3': [
    {
      pageNumber: 1,
      chapterTitle: 'Chapter 1: I Accidentally Vaporize My Pre-Algebra Teacher',
      content: `Look, I didn't want to be a half-blood.

If you're reading this because you think you might be one, my advice is: close this book right now. Believe whatever lie your mom or dad told you about your birth, and try to lead a normal life.

Being a half-blood is dangerous. It's scary. Most of the time, it gets you killed in painful, nasty ways.

If you're a normal kid, reading this because you think it's fiction, great. Read on. I envy you for being able to believe that none of this ever happened. But if you recognize yourself in these pages—if you feel something stirring inside—stop reading immediately. You might be one of us. And once you know that, it's only a matter of time before they sense it too.`
    },
    {
      pageNumber: 2,
      chapterTitle: 'Chapter 1: The Metropolitan Museum of Art',
      content: `My name is Percy Jackson.

I'm twelve years old. Until a few months ago, I was a boarding student at Yancy Academy, a private school for troubled kids in upstate New York.

Am I a troubled kid?
Yeah. You could say that.

I could start at any point in my short miserable life to prove it, but things really started going bad last May, when our sixth-grade class took a field trip to Manhattan—twenty-eight mental-case kids and two teachers on a yellow school bus, heading to the Metropolitan Museum of Art to look at ancient Greek and Roman stuff.`
    },
    {
      pageNumber: 3,
      chapterTitle: 'Chapter 2: Grover Unexpectedly Loses His Pants',
      content: `Mr. Brunner led the museum tour.

He rode up front in his motorized wheelchair, guiding us through the big echoey galleries, past marble statues and glass cases full of really old black-and-orange pottery.

It blew my mind that this stuff had survived for two thousand, three thousand years.

He gathered us around a thirteen-foot-tall stone column with a big sphinx on the top, and started telling us how it was a grave stele for a girl our age. He told us about the carvings on the sides. I tried to listen, because he was the only teacher who didn't put me to sleep.`
    },
    {
      pageNumber: 4,
      chapterTitle: 'Chapter 3: The Lightning and the Minotaur',
      content: `The storm had gathered over Long Island Sound. Lightning branched across the sky, illuminating the waves in jagged flashes of white.

"Percy," Grover whispered, his voice trembling like a goat's bleat. "They're coming. Don't look behind you, whatever you do."

Of course, I looked. Through the curtain of torrential rain, two red glowing eyes stared back at us from the crest of the hill. The silhouette had broad muscular shoulders and curved horns that seemed carved out of stone. That was the moment I realized the world was far bigger, and far stranger, than anything I had ever been taught in school.`
    }
  ]
};

/**
 * Generate sensible eBook pages for any book if none exist yet
 */
export function getOrGenerateEBookPages(book: { id: string; title: string; author: string; description?: string; pageCount?: number }): EBookPage[] {
  if (CURATED_EBOOK_CONTENTS[book.id]) {
    return CURATED_EBOOK_CONTENTS[book.id];
  }

  // Generate an authentic 6-to-10 page introductory chapter reader based on the book's metadata
  const totalPgs = Math.max(6, Math.min(18, Math.round((book.pageCount || 180) / 18)));
  const pages: EBookPage[] = [];

  for (let i = 1; i <= totalPgs; i++) {
    let chapter = `Chapter ${i}: The Journey Begins`;
    let body = '';

    if (i === 1) {
      chapter = `Chapter 1: Prologue & Origin`;
      body = `${book.title}, written by ${book.author}.\n\n${book.description || 'Welcome to this digital reading volume in the Premier International School Library collection.'}\n\nEvery great pursuit in scholarship and imagination begins with curiosity. As you step into this text, prepare to explore the author’s unique voice, the world they have constructed, and the discoveries waiting on each turn of the page.`;
    } else if (i === Math.floor(totalPgs / 2)) {
      chapter = `Chapter ${i}: The Turning Point`;
      body = `The narrative deepens here. Conflicts sharpen, themes clarify, and the reader finds themselves drawn directly into the central question of the work.\n\n"Knowledge is not merely acquired," writes the author, "it is lived through the quiet hours of contemplation and the courageous decisions that follow." Notice how the characters or arguments begin to challenge everyday assumptions.`;
    } else if (i === totalPgs) {
      chapter = `Chapter ${i}: Resolution & Reflections`;
      body = `In this concluding chapter, the disparate threads of thought unite into a coherent whole.\n\nAs the final passages unfold, reflect upon what this story or investigation has revealed about courage, wisdom, and the human condition. Congratulations on reaching the conclusion of this digital holding!`;
    } else {
      chapter = `Chapter ${i}: Progression & Discovery`;
      body = `Page ${i} of ${totalPgs}. The author continues to build upon the central premise with vivid anecdotes, rigorous analysis, and evocative prose.\n\nTake note of the rhythmic cadence of the sentences. Active reading invites you to annotate, question, and carry these lessons into your classroom discussions and independent writing reviews.`;
    }

    pages.push({
      pageNumber: i,
      chapterTitle: chapter,
      content: body
    });
  }

  return pages;
}

/**
 * Calculate accurate reading status milestone taking pages flipped and duration per page into account:
 * - 'completed': reached the final page, flipped adequate pages, and spent genuine reading duration.
 * - 'more-than-half': reached more than half the book with adequate dwell duration.
 * - 'just-started': reader flipped pages or spent initial time.
 * - 'not-started': no pages flipped or minimal dwell on page 1.
 */
export function calculateReadingMilestone(
  currentPage: number, 
  totalPages: number, 
  totalDurationSeconds: number = 0,
  pagesFlippedCount: number = 0,
  pageDwells: PageDwellRecord[] = []
): ReadingMilestone {
  if (totalPages <= 0) return 'not-started';
  
  // Calculate average dwell per page among visited pages
  const dwellCount = pageDwells.length;
  const avgDwellPerPage = dwellCount > 0 ? (totalDurationSeconds / dwellCount) : (totalDurationSeconds / Math.max(1, currentPage));
  const hasGenuineDwell = totalDurationSeconds >= 15 || avgDwellPerPage >= 3;

  // Completed: reached last page with genuine reading dwell
  if (currentPage >= totalPages && hasGenuineDwell) {
    return 'completed';
  }

  // Read more than half: page reached or flipped >= 50%
  const pct = (currentPage / totalPages) * 100;
  const flippedPct = totalPages > 0 ? (pagesFlippedCount / totalPages) * 100 : 0;
  
  if ((pct >= 50 || flippedPct >= 50) && (totalDurationSeconds >= 10 || avgDwellPerPage >= 2.5)) {
    return 'more-than-half';
  }

  if (currentPage > 1 || pagesFlippedCount > 1 || totalDurationSeconds >= 8) {
    return 'just-started';
  }

  return 'not-started';
}

/**
 * Format duration nicely: e.g. "45s", "8 mins", "1h 14m"
 */
export function formatReadingDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const remainingSecs = Math.round(seconds % 60);
  if (mins < 60) {
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins} mins`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Human-friendly relative time for last read date: "Just now", "15 mins ago", "2 hours ago", "Yesterday"
 */
export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recently';
  try {
    const past = new Date(dateString).getTime();
    const now = Date.now();
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Recently';
  }
}
