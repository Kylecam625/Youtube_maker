import { useState } from "react";
import { useProjectsStore } from "@/stores/projects";
import { Modal, Input, Textarea, Button } from "@/components/common";

interface NewProjectModalProps {
  is_open: boolean;
  onClose: () => void;
}

export function NewProjectModal({ is_open, onClose }: NewProjectModalProps) {
  const { createProject } = useProjectsStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [is_submitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await createProject({
        title: title.trim(),
        description: description.trim(),
        status: "idea",
        due_date: dueDate || null,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal is_open={is_open} onClose={onClose} title="New Project">
      <div className="space-y-4">
        <Input
          label="Project Title"
          placeholder="My Awesome Video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <Textarea
          label="Description"
          placeholder="What's this video about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Due Date (optional)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            is_loading={is_submitting}
            disabled={!title.trim()}
          >
            Create Project
          </Button>
        </div>
      </div>
    </Modal>
  );
}
