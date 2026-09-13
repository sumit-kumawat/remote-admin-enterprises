using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RemoteAdmin.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEndpointAuthAndDeviceType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AuthMode",
                table: "Endpoints",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AuthStatus",
                table: "Endpoints",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AuthUser",
                table: "Endpoints",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CredentialProfileId",
                table: "Endpoints",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeviceType",
                table: "Endpoints",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Endpoints_CredentialProfileId",
                table: "Endpoints",
                column: "CredentialProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Endpoints_CredentialProfiles_CredentialProfileId",
                table: "Endpoints",
                column: "CredentialProfileId",
                principalTable: "CredentialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Endpoints_CredentialProfiles_CredentialProfileId",
                table: "Endpoints");

            migrationBuilder.DropIndex(
                name: "IX_Endpoints_CredentialProfileId",
                table: "Endpoints");

            migrationBuilder.DropColumn(
                name: "AuthMode",
                table: "Endpoints");

            migrationBuilder.DropColumn(
                name: "AuthStatus",
                table: "Endpoints");

            migrationBuilder.DropColumn(
                name: "AuthUser",
                table: "Endpoints");

            migrationBuilder.DropColumn(
                name: "CredentialProfileId",
                table: "Endpoints");

            migrationBuilder.DropColumn(
                name: "DeviceType",
                table: "Endpoints");
        }
    }
}
