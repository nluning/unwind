-- Allow the tappable Q&A route (POST /activities/suggest-from-answers) to
-- record its usage for rate limiting. Extends the endpoint CHECK with the new
-- value (plan 21 Phase 5).

ALTER TABLE api_usage DROP CONSTRAINT api_usage_endpoint_check;

ALTER TABLE api_usage
ADD CONSTRAINT api_usage_endpoint_check
CHECK (endpoint IN ('chat', 'onboarding', 'suggest_from_list', 'suggest_from_answers'));
