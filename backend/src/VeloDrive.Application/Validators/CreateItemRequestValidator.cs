using FluentValidation;
using VeloDrive.Application.Dtos;

namespace VeloDrive.Application.Validators;

public class CreateItemRequestValidator : AbstractValidator<CreateItemRequest>
{
    public CreateItemRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.BasePrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.UnitType).NotEmpty()
            .Must(u => new[] { "Hour", "Day", "Week", "Month", "Flat" }.Contains(u))
            .WithMessage("UnitType must be one of: Hour, Day, Week, Month, Flat.");
    }
}
