namespace VeloDrive.Domain;

public class BookingItem
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid ItemId { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public DateTime CreatedOnUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedOnUtc { get; set; } = DateTime.UtcNow;

    public Booking Booking { get; set; } = null!;
    public Item Item { get; set; } = null!;
    public ICollection<BookingAddOn> BookingAddOns { get; set; } = new List<BookingAddOn>();
}
