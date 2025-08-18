-- Email logs table to track sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task_reminder', 'bill_alert', 'payment_reminder', 'invitation', 'spending_summary')),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  external_id TEXT, -- ID from email service provider (e.g., Resend)
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update email logs" ON email_logs
  FOR UPDATE USING (true);

-- Grant permissions
GRANT SELECT ON email_logs TO authenticated;
GRANT INSERT, UPDATE ON email_logs TO service_role;

-- Function to get email statistics for a user
CREATE OR REPLACE FUNCTION get_user_email_stats(user_uuid UUID)
RETURNS TABLE (
  total_emails INTEGER,
  emails_this_month INTEGER,
  emails_by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_emails,
    COUNT(CASE WHEN sent_at >= date_trunc('month', CURRENT_DATE) THEN 1 END)::INTEGER as emails_this_month,
    jsonb_object_agg(type, type_count) as emails_by_type
  FROM (
    SELECT 
      type,
      COUNT(*) as type_count
    FROM email_logs 
    WHERE user_id = user_uuid 
      AND status = 'sent'
    GROUP BY type
  ) type_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old email logs (keep last 6 months)
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_logs 
  WHERE sent_at < CURRENT_DATE - INTERVAL '6 months';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_email_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_email_logs() TO service_role;
