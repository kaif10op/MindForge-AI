import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().default(""),
  is_pinned: z.boolean().optional().default(false),
  tag_ids: z.array(z.string().uuid()).optional().default([]),
});

export const noteUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  is_pinned: z.boolean().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(30, "Tag name too long"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .default("#6366f1"),
});

export const tagUpdateSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const summarizeSchema = z.object({
  url: z
    .string()
    .url("Must be a valid URL")
    .refine(
      (url) => {
        return (
          url.includes("youtube.com") ||
          url.includes("youtu.be")
        );
      },
      { message: "Must be a valid YouTube URL" }
    ),
});

export const researchSchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(1000, "Question too long"),
});

export const deleteUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});
