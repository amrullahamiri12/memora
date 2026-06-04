-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_flashcards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topic_id" TEXT NOT NULL,
    "question_type" TEXT NOT NULL DEFAULT 'MCQ',
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "distractor_1" TEXT,
    "distractor_2" TEXT,
    "distractor_3" TEXT,
    "difficulty" TEXT NOT NULL,
    CONSTRAINT "flashcards_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_flashcards" ("answer", "difficulty", "distractor_1", "distractor_2", "distractor_3", "id", "question", "topic_id") SELECT "answer", "difficulty", "distractor_1", "distractor_2", "distractor_3", "id", "question", "topic_id" FROM "flashcards";
DROP TABLE "flashcards";
ALTER TABLE "new_flashcards" RENAME TO "flashcards";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
