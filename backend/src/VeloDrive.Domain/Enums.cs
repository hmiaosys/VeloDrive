namespace VeloDrive.Domain;

public enum SubscriptionStatus
{
    Trialing,
    Active,
    PastDue,
    Canceled,
    Unpaid
}

public enum UserRole
{
    Owner,
    Admin,
    Manager,
    Staff
}

public enum UnitType
{
    Hour,
    Day,
    Week,
    Month,
    Flat
}

public enum BookingStatus
{
    Draft,
    Quoted,
    Confirmed,
    InProgress,
    Completed,
    Canceled
}

public enum QuoteStatus
{
    Draft,
    Sent,
    Accepted,
    Declined,
    Expired
}

public enum InvoiceType
{
    Deposit,
    Full,
    Adjustment
}

public enum InvoiceStatus
{
    Draft,
    Sent,
    Paid,
    PartiallyPaid,
    Overdue,
    Void
}

public enum PaymentMethod
{
    BankTransfer,
    Cash,
    Check,
    CreditCard,
    Other
}
