using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCouponVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVisible",
                table: "Coupons",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVisible",
                table: "Coupons");
        }
    }
}
