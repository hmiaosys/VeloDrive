using Microsoft.AspNetCore.Identity;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.Persistence;

namespace VeloDrive.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        if (db.Tenants.Any()) return;

        // ===== TENANT =====
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Metro Bus Rentals",
            Subdomain = "default",
            Currency = "USD",
            Timezone = "America/Chicago",
            SubscriptionStatus = SubscriptionStatus.Active
        };
        db.Tenants.Add(tenant);

        // ===== USERS (for RBAC testing) =====
        var owner = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            UserName = "owner@metrobus.com",
            Email = "owner@metrobus.com",
            FullName = "Sarah Johnson",
            Role = UserRole.Owner
        };
        await userManager.CreateAsync(owner, "Admin123!");

        var admin = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            UserName = "manager@metrobus.com",
            Email = "manager@metrobus.com",
            FullName = "Michael Chen",
            Role = UserRole.Admin
        };
        await userManager.CreateAsync(admin, "Admin123!");

        var staff1 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            UserName = "driver1@metrobus.com",
            Email = "driver1@metrobus.com",
            FullName = "James Wilson",
            Role = UserRole.Staff
        };
        await userManager.CreateAsync(staff1, "Admin123!");

        var staff2 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            UserName = "guide1@metrobus.com",
            Email = "guide1@metrobus.com",
            FullName = "Maria Garcia",
            Role = UserRole.Staff
        };
        await userManager.CreateAsync(staff2, "Admin123!");

        // ===== CATEGORIES =====
        var busCategory = new ItemCategory
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Buses",
            Slug = "buses",
            Description = "Tour and charter buses",
            DisplayOrder = 1,
            AttributeSchema = """{"seats":{"type":"number","label":"Passenger Seats","required":true},"transmission":{"type":"select","label":"Transmission","options":["Automatic","Manual"]},"fuelType":{"type":"select","label":"Fuel Type","options":["Diesel","Gasoline","Electric"]},"hasRestroom":{"type":"boolean","label":"Has Restroom"},"hasEntertainment":{"type":"boolean","label":"Entertainment System"},"year":{"type":"number","label":"Year"},"make":{"type":"string","label":"Make"},"model":{"type":"string","label":"Model"}}"""
        };
        db.ItemCategories.Add(busCategory);

        var vanCategory = new ItemCategory
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Vans",
            Slug = "vans",
            Description = "Passenger and cargo vans",
            DisplayOrder = 2,
            AttributeSchema = """{"seats":{"type":"number","label":"Passenger Seats","required":true},"year":{"type":"number","label":"Year"},"make":{"type":"string","label":"Make"},"model":{"type":"string","label":"Model"}}"""
        };
        db.ItemCategories.Add(vanCategory);

        // ===== ITEMS (Buses) =====
        var bus1 = new Item
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CategoryId = busCategory.Id,
            Name = "Mercedes-Benz Tourismo 54-Seater",
            Slug = "mercedes-benz-tourismo-54",
            Sku = "BUS-001",
            Description = "Luxury touring coach with restroom, entertainment system, and reclining seats. Perfect for long-distance charters.",
            UnitType = UnitType.Day,
            BasePrice = 650.00m,
            DepositAmount = 500.00m,
            Quantity = 2,
            CustomFields = """{"seats":54,"transmission":"Automatic","fuelType":"Diesel","hasRestroom":true,"hasEntertainment":true,"year":2024,"make":"Mercedes-Benz","model":"Tourismo"}""",
            Images = new[] { "https://picsum.photos/seed/bus1/800/600" }
        };
        db.Items.Add(bus1);

        var bus2 = new Item
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CategoryId = busCategory.Id,
            Name = "Volvo 9700 48-Seater",
            Slug = "volvo-9700-48",
            Sku = "BUS-002",
            Description = "Mid-size luxury coach ideal for corporate events and airport transfers.",
            UnitType = UnitType.Day,
            BasePrice = 550.00m,
            DepositAmount = 400.00m,
            Quantity = 1,
            CustomFields = """{"seats":48,"transmission":"Automatic","fuelType":"Diesel","hasRestroom":true,"hasEntertainment":true,"year":2023,"make":"Volvo","model":"9700"}""",
            Images = new[] { "https://picsum.photos/seed/bus2/800/600" }
        };
        db.Items.Add(bus2);

        var bus3 = new Item
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CategoryId = busCategory.Id,
            Name = "Setra S 511 HD 36-Seater",
            Slug = "setra-s511-36",
            Sku = "BUS-003",
            Description = "Compact luxury coach for smaller groups. Great fuel economy.",
            UnitType = UnitType.Day,
            BasePrice = 450.00m,
            DepositAmount = 300.00m,
            Quantity = 3,
            CustomFields = """{"seats":36,"transmission":"Automatic","fuelType":"Diesel","hasRestroom":false,"hasEntertainment":true,"year":2024,"make":"Setra","model":"S 511 HD"}""",
            Images = new[] { "https://picsum.photos/seed/bus3/800/600" }
        };
        db.Items.Add(bus3);

        var bus4 = new Item
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CategoryId = busCategory.Id,
            Name = "Yutong TC12 30-Seater",
            Slug = "yutong-tc12-30",
            Sku = "BUS-004",
            Description = "Budget-friendly midi coach. Good for school trips and local tours.",
            UnitType = UnitType.Day,
            BasePrice = 350.00m,
            DepositAmount = 250.00m,
            Quantity = 2,
            CustomFields = """{"seats":30,"transmission":"Manual","fuelType":"Diesel","hasRestroom":false,"hasEntertainment":false,"year":2022,"make":"Yutong","model":"TC12"}""",
            Images = new[] { "https://picsum.photos/seed/bus4/800/600" }
        };
        db.Items.Add(bus4);

        var van1 = new Item
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            CategoryId = vanCategory.Id,
            Name = "Mercedes Sprinter 15-Seater",
            Slug = "mercedes-sprinter-15",
            Sku = "VAN-001",
            Description = "Comfortable passenger van for small groups. Great for airport runs.",
            UnitType = UnitType.Day,
            BasePrice = 200.00m,
            DepositAmount = 150.00m,
            Quantity = 2,
            CustomFields = """{"seats":15,"year":2025,"make":"Mercedes-Benz","model":"Sprinter"}""",
            Images = new[] { "https://picsum.photos/seed/van1/800/600" }
        };
        db.Items.Add(van1);

        // ===== ADD-ONS =====
        var driverAddOn = new ItemAddOn
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Professional Driver",
            Description = "Licensed commercial driver with clean record. Includes fuel cost.",
            UnitType = UnitType.Day,
            BasePrice = 200.00m,
            IsPerItem = true
        };
        db.ItemAddOns.Add(driverAddOn);

        var guideAddOn = new ItemAddOn
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Tour Guide",
            Description = "Multilingual tour guide with local expertise.",
            UnitType = UnitType.Day,
            BasePrice = 175.00m,
            IsPerItem = false
        };
        db.ItemAddOns.Add(guideAddOn);

        var cleaningAddOn = new ItemAddOn
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            Name = "Premium Cleaning",
            Description = "Deep clean after rental. Required for multi-day tours.",
            UnitType = UnitType.Flat,
            BasePrice = 150.00m,
            IsPerItem = true
        };
        db.ItemAddOns.Add(cleaningAddOn);

        // ===== CUSTOMERS =====
        var customer1 = new Customer
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            FirstName = "Robert",
            LastName = "Thompson",
            CompanyName = "Citywide Corporate Events",
            Email = "robert@citywideevents.com",
            Phone = "+1-312-555-0101",
            BillingAddress = "200 W Madison St, Chicago, IL 60606",
            Notes = "Regular corporate client. Always pays on time. Prefers the Mercedes Tourismo.",
            Source = "Referral",
            TotalBookings = 3,
            TotalRevenue = 5200.00m
        };
        db.Customers.Add(customer1);

        var customer2 = new Customer
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            FirstName = "Lisa",
            LastName = "Brenner",
            CompanyName = "Chicago Public Schools District",
            Email = "lbrenner@cps.edu",
            Phone = "+1-773-555-0202",
            BillingAddress = "42 W Madison St, Chicago, IL 60602",
            Notes = "Books 3-4 field trips per year. Requires invoice before booking confirmation. Net-30 payment terms.",
            Source = "Website",
            TotalBookings = 5,
            TotalRevenue = 8750.00m
        };
        db.Customers.Add(customer2);

        var customer3 = new Customer
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            FirstName = "David",
            LastName = "Kim",
            CompanyName = "Windy City Tours LLC",
            Email = "david@windycitytours.com",
            Phone = "+1-312-555-0303",
            BillingAddress = "875 N Michigan Ave, Chicago, IL 60611",
            Notes = "Tour operator. Books weekly. Needs tour guide add-on every time.",
            Source = "Trade Show",
            TotalBookings = 12,
            TotalRevenue = 18600.00m
        };
        db.Customers.Add(customer3);

        var customer4 = new Customer
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            FirstName = "Jennifer",
            LastName = "Patel",
            CompanyName = null,
            Email = "jennifer.patel@email.com",
            Phone = "+1-847-555-0404",
            BillingAddress = "450 Oak St, Evanston, IL 60201",
            Notes = "Individual customer. Wedding party transport planned for August.",
            Source = "Social Media",
            TotalBookings = 1,
            TotalRevenue = 900.00m
        };
        db.Customers.Add(customer4);

        // ===== BOOKINGS =====
        var booking1 = new Booking
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            BookingNumber = "BK-2026-0001",
            CustomerId = customer1.Id,
            Status = BookingStatus.Confirmed,
            StartDate = new DateOnly(2026, 6, 15),
            EndDate = new DateOnly(2026, 6, 16),
            PickupTime = new TimeOnly(8, 0),
            ReturnTime = new TimeOnly(20, 0),
            PickupLocation = "200 W Madison St, Chicago, IL 60606",
            DropoffLocation = "O'Hare International Airport",
            Subtotal = 1300.00m,
            TaxRate = 0.1025m,
            TaxAmount = 133.25m,
            TotalAmount = 1433.25m,
            DepositRequired = 500.00m,
            CustomerNotes = "Need the Mercedes Tourismo with a driver. Picking up executives for a conference.",
            InternalNotes = "Robert always requests James as driver if available."
        };
        db.Bookings.Add(booking1);

        var bookingItem1 = new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = booking1.Id,
            ItemId = bus1.Id,
            Quantity = 1,
            UnitPrice = 650.00m,
            LineTotal = 1300.00m
        };
        db.BookingItems.Add(bookingItem1);

        var bookingAddOn1 = new BookingAddOn
        {
            Id = Guid.NewGuid(),
            BookingId = booking1.Id,
            BookingItemId = bookingItem1.Id,
            AddOnId = driverAddOn.Id,
            Quantity = 2,
            UnitPrice = 200.00m,
            LineTotal = 400.00m
        };
        db.BookingAddOns.Add(bookingAddOn1);

        // Recalculate booking total
        booking1.Subtotal = bookingItem1.LineTotal + bookingAddOn1.LineTotal;
        booking1.TaxAmount = booking1.Subtotal * booking1.TaxRate;
        booking1.TotalAmount = booking1.Subtotal + booking1.TaxAmount;

        var booking2 = new Booking
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            BookingNumber = "BK-2026-0002",
            CustomerId = customer3.Id,
            Status = BookingStatus.InProgress,
            StartDate = new DateOnly(2026, 5, 25),
            EndDate = new DateOnly(2026, 5, 25),
            PickupTime = new TimeOnly(9, 0),
            ReturnTime = new TimeOnly(17, 0),
            PickupLocation = "875 N Michigan Ave, Chicago, IL 60611",
            DropoffLocation = "875 N Michigan Ave, Chicago, IL 60611",
            Subtotal = 625.00m,
            TaxRate = 0.1025m,
            TaxAmount = 64.06m,
            TotalAmount = 689.06m,
            DepositRequired = 250.00m,
            CustomerNotes = "City tour for international visitors. Need tour guide who speaks Spanish.",
            InternalNotes = "Maria Garcia assigned as tour guide."
        };
        db.Bookings.Add(booking2);

        var bookingItem2 = new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = booking2.Id,
            ItemId = bus3.Id,
            Quantity = 1,
            UnitPrice = 450.00m,
            LineTotal = 450.00m
        };
        db.BookingItems.Add(bookingItem2);

        var bookingAddOn2 = new BookingAddOn
        {
            Id = Guid.NewGuid(),
            BookingId = booking2.Id,
            AddOnId = guideAddOn.Id,
            Quantity = 1,
            UnitPrice = 175.00m,
            LineTotal = 175.00m
        };
        db.BookingAddOns.Add(bookingAddOn2);

        booking2.Subtotal = bookingItem2.LineTotal + bookingAddOn2.LineTotal;
        booking2.TaxAmount = booking2.Subtotal * booking2.TaxRate;
        booking2.TotalAmount = booking2.Subtotal + booking2.TaxAmount;

        var booking3 = new Booking
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            BookingNumber = "BK-2026-0003",
            CustomerId = customer2.Id,
            Status = BookingStatus.Draft,
            StartDate = new DateOnly(2026, 7, 10),
            EndDate = new DateOnly(2026, 7, 10),
            PickupLocation = "42 W Madison St, Chicago, IL 60602",
            DropoffLocation = "Museum of Science and Industry",
            CustomerNotes = "Field trip - 45 students + 5 chaperones. Need 2 buses with drivers.",
            InternalNotes = "Quote sent, waiting for school board approval."
        };
        db.Bookings.Add(booking3);

        var bookingItem3 = new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = booking3.Id,
            ItemId = bus1.Id,
            Quantity = 1,
            UnitPrice = 650.00m,
            LineTotal = 650.00m
        };
        db.BookingItems.Add(bookingItem3);

        var bookingItem3b = new BookingItem
        {
            Id = Guid.NewGuid(),
            BookingId = booking3.Id,
            ItemId = bus4.Id,
            Quantity = 1,
            UnitPrice = 350.00m,
            LineTotal = 350.00m
        };
        db.BookingItems.Add(bookingItem3b);

        booking3.Subtotal = bookingItem3.LineTotal + bookingItem3b.LineTotal;
        booking3.TaxAmount = booking3.Subtotal * booking3.TaxRate;
        booking3.TotalAmount = booking3.Subtotal + booking3.TaxAmount;

        // ===== QUOTE =====
        var quote = new Quote
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            BookingId = booking3.Id,
            QuoteNumber = "QUO-2026-0001",
            CustomerId = customer2.Id,
            Status = QuoteStatus.Sent,
            ValidUntil = new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc),
            ItemsSnapshot = """[{"item":"Mercedes-Benz Tourismo 54-Seater","qty":1,"price":650},{"item":"Yutong TC12 30-Seater","qty":1,"price":350}]""",
            Subtotal = 1000.00m,
            TotalAmount = 1000.00m,
            SentAt = new DateTime(2026, 5, 20, 14, 30, 0, DateTimeKind.Utc)
        };
        db.Quotes.Add(quote);

        // ===== INVOICES & PAYMENTS =====
        var invoice1 = new Invoice
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            InvoiceNumber = "INV-2026-0001",
            BookingId = booking1.Id,
            Type = InvoiceType.Deposit,
            Status = InvoiceStatus.Paid,
            IssuedAt = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc),
            DueAt = new DateTime(2026, 5, 24, 0, 0, 0, DateTimeKind.Utc),
            Subtotal = 1700.00m,
            TaxAmount = 174.25m,
            TotalAmount = 1874.25m,
            AmountPaid = 500.00m,
            AmountDue = 1374.25m
        };
        db.Invoices.Add(invoice1);

        var payment1 = new Payment
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            InvoiceId = invoice1.Id,
            Amount = 500.00m,
            Method = PaymentMethod.BankTransfer,
            Reference = "TRF-20260512-001",
            ReceivedAt = new DateTime(2026, 5, 12, 0, 0, 0, DateTimeKind.Utc),
            Notes = "Deposit received via wire transfer",
            RecordedByUserId = admin.Id
        };
        db.Payments.Add(payment1);

        invoice1.AmountPaid = payment1.Amount;
        invoice1.AmountDue = invoice1.TotalAmount - payment1.Amount;

        var invoice2 = new Invoice
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            InvoiceNumber = "INV-2026-0002",
            BookingId = booking2.Id,
            Type = InvoiceType.Full,
            Status = InvoiceStatus.PartiallyPaid,
            IssuedAt = new DateTime(2026, 5, 18, 0, 0, 0, DateTimeKind.Utc),
            DueAt = new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            Subtotal = 625.00m,
            TaxAmount = 64.06m,
            TotalAmount = 689.06m,
            AmountPaid = 400.00m,
            AmountDue = 289.06m
        };
        db.Invoices.Add(invoice2);

        var payment2 = new Payment
        {
            Id = Guid.NewGuid(),
            TenantId = tenant.Id,
            InvoiceId = invoice2.Id,
            Amount = 400.00m,
            Method = PaymentMethod.CreditCard,
            Reference = "CHG-20260520-002",
            ReceivedAt = new DateTime(2026, 5, 20, 0, 0, 0, DateTimeKind.Utc),
            Notes = "Partial payment via credit card",
            RecordedByUserId = admin.Id
        };
        db.Payments.Add(payment2);

        await db.SaveChangesAsync();
    }
}
