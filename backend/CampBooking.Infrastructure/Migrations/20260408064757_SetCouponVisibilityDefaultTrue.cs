using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CampBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SetCouponVisibilityDefaultTrue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE [Coupons] SET [IsVisible] = 1 WHERE [IsVisible] = 0");

            migrationBuilder.AlterColumn<bool>(
                name: "IsVisible",
                table: "Coupons",
                type: "bit",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "bit");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsVisible",
                table: "Coupons",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: true);
        }
    }
}
