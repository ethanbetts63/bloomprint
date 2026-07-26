def get_user_role(user):
    if user.is_staff or user.is_superuser:
        return 'admin'
    account = getattr(user, 'partner_profile', None)
    if account is not None:
        return 'florist' if account.partner_type == 'delivery' else 'affiliate'
    return 'customer'
