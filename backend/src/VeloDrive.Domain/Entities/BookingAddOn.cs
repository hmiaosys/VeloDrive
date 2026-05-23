namespace VeloDrive.Domain;

public class BookingAddOn
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid? BookingItemId { get; set; } // null = applies to entire booking
    public Guid AddOnId { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }

    public Booking Booking { get; set; } = null!;
    public BookingItem? BookingItem { get; set; }
    public ItemAddOn AddOn { get; set; } = null!;
}
