import { z } from 'zod'

// Course ids are validated by shape rather than against a fixed list, so adding a
// course to COURSES in app/page.tsx doesn't require editing this file too.
const COURSE_SLUG = /^[a-z0-9-]+$/

export const wishlistSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your name')
    .max(100, 'That name is too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .max(200),
  phone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number')
    .max(30, 'That number is too long'),
  country: z.string().trim().min(1, 'Select your country').max(60),
  role: z.string().trim().min(1, 'Select your role').max(60),
  courses: z
    .array(z.string().regex(COURSE_SLUG).max(60))
    .min(1, 'Pick at least one course')
    .max(20, 'That is every course we have — pick the ones you actually want'),
  note: z.string().trim().max(2000, 'Please keep this under 2000 characters').optional(),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: 'Please agree so we can email you' }),
  }),
  // Honeypot. Real users never see this field; bots fill it in. Kept permissive
  // here so the client never renders an error for it — the API drops it silently.
  website: z.string().max(200).optional(),
})

export type WishlistInput = z.infer<typeof wishlistSchema>
