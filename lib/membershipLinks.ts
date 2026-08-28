import { isActiveWebMembership, MembershipRecord } from '@/lib/membership';
import { getSupabaseService } from '@/lib/supabase';

export interface LinkedMembershipStatus {
  purchaseEmail: string;
  verifiedAt: string;
}

export async function getLinkedWebMembership(appEmail: string): Promise<MembershipRecord | null> {
  const supabase = getSupabaseService();
  const { data: link, error: linkError } = await supabase
    .from('membership_email_links')
    .select('purchase_email')
    .eq('app_email', appEmail.toLowerCase().trim())
    .maybeSingle();

  if (linkError) throw new Error(`Unable to load linked membership: ${linkError.message}`);
  if (!link) return null;

  const { data: source, error: sourceError } = await supabase
    .from('users')
    .select('is_pro, pro_expires_at')
    .eq('email', link.purchase_email)
    .maybeSingle();

  if (sourceError) throw new Error(`Unable to load purchase membership: ${sourceError.message}`);
  return source || null;
}

export async function getLinkedMembershipStatus(appEmail: string): Promise<LinkedMembershipStatus | null> {
  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from('membership_email_links')
    .select('purchase_email, verified_at')
    .eq('app_email', appEmail.toLowerCase().trim())
    .maybeSingle();

  if (error) throw new Error(`Unable to load linked membership: ${error.message}`);
  if (!data) return null;
  return { purchaseEmail: data.purchase_email, verifiedAt: data.verified_at };
}

export function mergeLinkedWebMembership<T extends MembershipRecord>(
  user: T,
  linkedMembership: MembershipRecord | null,
  now = Date.now(),
): T {
  if (!linkedMembership || !isActiveWebMembership(linkedMembership, now)) return user;
  if (!isActiveWebMembership(user, now)) {
    return {
      ...user,
      is_pro: true,
      pro_expires_at: linkedMembership.pro_expires_at || null,
    };
  }

  const directExpiry = user.pro_expires_at || null;
  const linkedExpiry = linkedMembership.pro_expires_at || null;
  const effectiveExpiry = !directExpiry || !linkedExpiry
    ? null
    : new Date(directExpiry).getTime() >= new Date(linkedExpiry).getTime()
      ? directExpiry
      : linkedExpiry;

  return { ...user, is_pro: true, pro_expires_at: effectiveExpiry };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

