def get_user_role(user):
    if user.is_staff or user.is_superuser:
        return 'admin'
    account = getattr(user, 'business_account', None)
    if account is not None:
        return account.account_type
    return 'customer'
