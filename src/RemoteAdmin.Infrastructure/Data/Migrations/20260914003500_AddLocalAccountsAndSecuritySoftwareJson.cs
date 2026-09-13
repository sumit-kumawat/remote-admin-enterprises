using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RemoteAdmin.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalAccountsAndSecuritySoftwareJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LocalAccountsJson",
                table: "Endpoints",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecuritySoftwareJson",
                table: "Endpoints",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LocalAccountsJson",
                table: "Endpoints");

            migrationBuilder.DropColumn(
                name: "SecuritySoftwareJson",
                table: "Endpoints");
        }
    }
}
