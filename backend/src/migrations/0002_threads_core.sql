CREATE TABLE IF NOT EXISTS categories(
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS threads (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id),
  author_user_id BIGINT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threads_category_created_at
  ON threads (category_id, created_at DESC);

INSERT INTO categories (slug, name, description)
VALUES
  ('general', 'General', 'Anything dev-related, off-topic but friendly'),
  ('q-and-a', 'Q&A', 'Ask and answer coding-related and career questions'),
  ('showcase', 'Showcase', 'Share what you are building with the community'),
  ('help', 'Help', 'Stuck on something? Ask others for help'),
  ('javascript', 'JavaScript', 'Discuss JavaScript, modern syntax, APIs, and tooling'),
  ('typescript', 'TypeScript', 'Discuss TypeScript, types, generics, and type-safe development'),
  ('react', 'React', 'Discuss React, components, hooks, state, and patterns'),
  ('nextjs', 'Next.js', 'Discuss Next.js, App Router, Server Components, and full-stack development'),
  ('nodejs', 'Node.js', 'Discuss Node.js, APIs, servers, and backend development'),
  ('backend', 'Backend', 'Backend architecture, APIs, services, and server-side development'),
  ('frontend', 'Frontend', 'UI development, browser APIs, CSS, and frontend architecture'),
  ('database', 'Database', 'Discuss PostgreSQL, SQL, database design, and queries'),
  ('devops', 'DevOps', 'Deployment, Docker, CI/CD, infrastructure, and cloud development'),
  ('testing', 'Testing', 'Unit testing, integration testing, E2E testing, and testing strategies'),
  ('career', 'Career', 'Discuss software engineering careers, interviews, and growth'),
  ('open-source', 'Open Source', 'Share and discuss open-source projects and contributions'),
  ('tools', 'Tools', 'Discuss editors, terminals, libraries, frameworks, and developer tools'),
  ('projects', 'Projects', 'Find collaborators and discuss project ideas'),
  ('feedback', 'Feedback', 'Get constructive feedback on your code, projects, and ideas')
ON CONFLICT (slug) DO NOTHING;
