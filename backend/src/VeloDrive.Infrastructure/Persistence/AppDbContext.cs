using System.Linq.Expressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VeloDrive.Domain;
using VeloDrive.Infrastructure.MultiTenancy;

namespace VeloDrive.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    private readonly ITenantProvider _tenantProvider;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<ItemCategory> ItemCategories => Set<ItemCategory>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<ItemAddOn> ItemAddOns => Set<ItemAddOn>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingItem> BookingItems => Set<BookingItem>();
    public DbSet<BookingAddOn> BookingAddOns => Set<BookingAddOn>();
    public DbSet<Quote> Quotes => Set<Quote>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Employee> Employees => Set<Employee>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Identity tables
        builder.Entity<ApplicationUser>(e =>
        {
            e.ToTable("Users");
            e.HasOne(u => u.Tenant)
                .WithMany(t => t.Users)
                .HasForeignKey(u => u.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<IdentityRole<Guid>>().ToTable("Roles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

        // Tenant
        builder.Entity<Tenant>(e =>
        {
            e.HasIndex(t => t.Subdomain).IsUnique();
        });

        // ItemCategory
        builder.Entity<ItemCategory>(e =>
        {
            e.HasIndex(c => new { c.TenantId, c.Slug }).IsUnique();
            e.HasOne(c => c.Tenant)
                .WithMany(t => t.ItemCategories)
                .HasForeignKey(c => c.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Item
        builder.Entity<Item>(e =>
        {
            e.HasIndex(i => new { i.TenantId, i.Sku }).IsUnique();
            e.HasOne(i => i.Tenant)
                .WithMany(t => t.Items)
                .HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.Category)
                .WithMany(c => c.Items)
                .HasForeignKey(i => i.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ItemAddOn
        builder.Entity<ItemAddOn>(e =>
        {
            e.HasOne(a => a.Tenant)
                .WithMany()
                .HasForeignKey(a => a.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Customer
        builder.Entity<Customer>(e =>
        {
            e.HasOne(c => c.Tenant)
                .WithMany()
                .HasForeignKey(c => c.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Booking
        builder.Entity<Booking>(e =>
        {
            e.HasIndex(b => new { b.TenantId, b.BookingNumber }).IsUnique();
            e.HasOne(b => b.Tenant)
                .WithMany()
                .HasForeignKey(b => b.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(b => b.Customer)
                .WithMany(c => c.Bookings)
                .HasForeignKey(b => b.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // BookingItem
        builder.Entity<BookingItem>(e =>
        {
            e.HasOne(bi => bi.Booking)
                .WithMany(b => b.BookingItems)
                .HasForeignKey(bi => bi.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(bi => bi.Item)
                .WithMany(i => i.BookingItems)
                .HasForeignKey(bi => bi.ItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // BookingAddOn
        builder.Entity<BookingAddOn>(e =>
        {
            e.HasOne(ba => ba.Booking)
                .WithMany(b => b.BookingAddOns)
                .HasForeignKey(ba => ba.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ba => ba.BookingItem)
                .WithMany(bi => bi.BookingAddOns)
                .HasForeignKey(ba => ba.BookingItemId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(ba => ba.AddOn)
                .WithMany(a => a.BookingAddOns)
                .HasForeignKey(ba => ba.AddOnId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Quote
        builder.Entity<Quote>(e =>
        {
            e.HasIndex(q => new { q.TenantId, q.QuoteNumber }).IsUnique();
            e.HasOne(q => q.Tenant)
                .WithMany()
                .HasForeignKey(q => q.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(q => q.Booking)
                .WithOne(b => b.Quote)
                .HasForeignKey<Quote>(q => q.BookingId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(q => q.Customer)
                .WithMany()
                .HasForeignKey(q => q.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Invoice
        builder.Entity<Invoice>(e =>
        {
            e.HasIndex(i => new { i.TenantId, i.InvoiceNumber }).IsUnique();
            e.HasOne(i => i.Tenant)
                .WithMany()
                .HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.Booking)
                .WithMany(b => b.Invoices)
                .HasForeignKey(i => i.BookingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Payment
        builder.Entity<Payment>(e =>
        {
            e.HasOne(p => p.Tenant)
                .WithMany()
                .HasForeignKey(p => p.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.Invoice)
                .WithMany(i => i.Payments)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.RecordedByUser)
                .WithMany()
                .HasForeignKey(p => p.RecordedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AuditLog
        builder.Entity<AuditLog>(e =>
        {
            e.HasOne(a => a.Tenant)
                .WithMany()
                .HasForeignKey(a => a.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Employee
        builder.Entity<Employee>(e =>
        {
            e.HasOne(emp => emp.Tenant)
                .WithMany()
                .HasForeignKey(emp => emp.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(emp => emp.User)
                .WithOne(u => u.Employee)
                .HasForeignKey<Employee>(emp => emp.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Global tenant query filter
        ApplyTenantFilter(builder);
    }

    private void ApplyTenantFilter(ModelBuilder builder)
    {
        var providerMethod = typeof(ITenantProvider).GetMethod(nameof(ITenantProvider.GetTenantId))!;
        var providerExpr = Expression.Constant(_tenantProvider);

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (!typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType)) continue;

            var parameter = Expression.Parameter(entityType.ClrType, "e");
            var property = Expression.Property(parameter, nameof(ITenantEntity.TenantId));

            // Call _tenantProvider.GetTenantId() at query time — not cached as constant
            var tenantIdExpr = Expression.Call(providerExpr, providerMethod);

            var equality = Expression.Equal(property, tenantIdExpr);
            var lambda = Expression.Lambda(equality, parameter);

            builder.Entity(entityType.ClrType).HasQueryFilter(lambda);
        }
    }
}
