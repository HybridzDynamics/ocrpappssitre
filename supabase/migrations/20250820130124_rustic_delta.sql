/*
  # Create admin users and authentication system

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text)
      - `role` (text, default 'admin')
      - `created_by` (uuid, references admin_users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on `admin_users` table
    - Add policies for authenticated admin access
    - Create default admin user

  3. Functions
    - Password hashing function
    - User creation function
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'admin',
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can read all admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can create new admin users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can update admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create password hashing function (simple hash for demo - in production use proper bcrypt)
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple hash function for demo purposes
  -- In production, use proper bcrypt or similar
  RETURN encode(digest(password || 'salt_ocrp_2024', 'sha256'), 'hex');
END;
$$;

-- Insert default admin user
INSERT INTO admin_users (username, password_hash, role)
VALUES ('admin_ocrp', hash_password('admin_ocrp_HRD_TEAM_PASS'), 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);