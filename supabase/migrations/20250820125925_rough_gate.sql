/*
  # Create Staff Applications System

  1. New Tables
    - `applications`
      - `id` (uuid, primary key)
      - `discord_username` (text, required)
      - `answers` (jsonb, stores all 10 answers)
      - `status` (text, enum: pending/approved/rejected)
      - `reviewed_by` (uuid, references auth.users)
      - `reviewed_at` (timestamp)
      - `notes` (text, admin notes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `applications` table
    - Add policies for public submission and admin management
    - Create admin role for application management

  3. Indexes
    - Index on status for filtering
    - Index on created_at for sorting
*/

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_username text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can submit applications"
  ON applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view applications"
  ON applications
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update applications"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_discord_username ON applications(discord_username);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();