-- Allow the analyse-fit route (POST /activities/suggest-from-list) to record
-- its usage for rate limiting. Extends the endpoint CHECK with the new value.

ALTER TABLE api_usage DROP CONSTRAINT api_usage_endpoint_check;

ALTER TABLE api_usage
ADD CONSTRAINT api_usage_endpoint_check
CHECK (endpoint IN ('chat', 'onboarding', 'suggest_from_list'));
