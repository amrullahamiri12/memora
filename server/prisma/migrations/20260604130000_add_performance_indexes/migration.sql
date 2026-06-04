-- CreateIndex
CREATE INDEX "flashcards_topic_id_idx" ON "flashcards"("topic_id");

-- CreateIndex
CREATE INDEX "topics_subject_id_idx" ON "topics"("subject_id");

-- CreateIndex
CREATE INDEX "user_progress_user_id_idx" ON "user_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_subjects_user_id_idx" ON "user_subjects"("user_id");
