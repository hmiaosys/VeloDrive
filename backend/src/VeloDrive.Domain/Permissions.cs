namespace VeloDrive.Domain;

public static class Permissions
{
    public const string ItemsRead = "items:read";
    public const string ItemsWrite = "items:write";
    public const string ItemsDelete = "items:delete";

    public const string CategoriesRead = "categories:read";
    public const string CategoriesWrite = "categories:write";
    public const string CategoriesDelete = "categories:delete";

    public const string AddOnsRead = "addons:read";
    public const string AddOnsWrite = "addons:write";
    public const string AddOnsDelete = "addons:delete";

    public const string CustomersRead = "customers:read";
    public const string CustomersWrite = "customers:write";
    public const string CustomersDelete = "customers:delete";
    public const string CustomersImport = "customers:import";

    public const string BookingsRead = "bookings:read";
    public const string BookingsWrite = "bookings:write";
    public const string BookingsDelete = "bookings:delete";
    public const string BookingsManageStatus = "bookings:manage_status";

    public const string QuotesRead = "quotes:read";
    public const string QuotesWrite = "quotes:write";
    public const string QuotesSend = "quotes:send";
    public const string QuotesManageStatus = "quotes:manage_status";

    public const string InvoicesRead = "invoices:read";
    public const string InvoicesWrite = "invoices:write";
    public const string InvoicesSend = "invoices:send";
    public const string InvoicesVoid = "invoices:void";

    public const string PaymentsRead = "payments:read";
    public const string PaymentsWrite = "payments:write";
    public const string PaymentsDelete = "payments:delete";

    public const string ReportsRead = "reports:read";

    public const string SettingsRead = "settings:read";
    public const string SettingsWrite = "settings:write";

    public const string UsersRead = "users:read";
    public const string UsersWrite = "users:write";

    /// <summary>All permissions grouped by role</summary>
    public static readonly Dictionary<UserRole, string[]> RolePermissions = new()
    {
        [UserRole.Owner] = AllPermissions,
        [UserRole.Admin] = new[]
        {
            ItemsRead, ItemsWrite, ItemsDelete,
            CategoriesRead, CategoriesWrite, CategoriesDelete,
            AddOnsRead, AddOnsWrite, AddOnsDelete,
            CustomersRead, CustomersWrite, CustomersDelete, CustomersImport,
            BookingsRead, BookingsWrite, BookingsDelete, BookingsManageStatus,
            QuotesRead, QuotesWrite, QuotesSend, QuotesManageStatus,
            InvoicesRead, InvoicesWrite, InvoicesSend, InvoicesVoid,
            PaymentsRead, PaymentsWrite, PaymentsDelete,
            ReportsRead,
            SettingsRead,
        },
        [UserRole.Manager] = new[]
        {
            ItemsRead, ItemsWrite,
            CategoriesRead, CategoriesWrite,
            AddOnsRead, AddOnsWrite,
            CustomersRead, CustomersWrite, CustomersImport,
            BookingsRead, BookingsWrite, BookingsManageStatus,
            QuotesRead, QuotesWrite, QuotesSend, QuotesManageStatus,
            InvoicesRead, InvoicesWrite, InvoicesSend,
            PaymentsRead, PaymentsWrite,
            ReportsRead,
        },
        [UserRole.Staff] = new[]
        {
            ItemsRead,
            CategoriesRead,
            AddOnsRead,
            CustomersRead,
            BookingsRead,
            QuotesRead,
            InvoicesRead,
            PaymentsRead,
        }
    };

    private static string[] AllPermissions => typeof(Permissions)
        .GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static)
        .Where(f => f.IsLiteral && !f.IsInitOnly && f.FieldType == typeof(string))
        .Select(f => (string)f.GetValue(null)!)
        .ToArray();
}
