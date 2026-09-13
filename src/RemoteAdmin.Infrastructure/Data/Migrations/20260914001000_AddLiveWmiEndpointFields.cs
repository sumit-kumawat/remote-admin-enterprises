using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RemoteAdmin.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLiveWmiEndpointFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CurrentInteractiveUser",
                table: "Endpoints",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DomainWorkgroup",
                table: "Endpoints",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSuccessfulRefresh",
                table: "Endpoints",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SectionStatusesJson",
                table: "Endpoints",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SystemUptime",
                table: "Endpoints",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentInteractiveUser",
                table: "Endpoints");

            migrationBuilder.DropColumn(
                name: "DomainWorkgroup",
                table: "Endpoints");

            migrationBuilder.DropColumn(
                name: "LastSuccessfulRefresh",
                table: "Endpoints");

            migrationBuilder.DropColumn(
                name: "SectionStatusesJson",
                table: "Endpoints");

            migrationBuilder.DropColumn(
                name: "SystemUptime",
                table: "Endpoints");
        }
    }
}
