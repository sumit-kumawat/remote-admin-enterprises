using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RemoteAdmin.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRealtimeDiscoveryScanner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DiscoveryScans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    TargetCidr = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ScanType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PortSet = table.Column<string>(type: "text", nullable: true),
                    Concurrency = table.Column<int>(type: "integer", nullable: false),
                    TimeoutMs = table.Column<int>(type: "integer", nullable: false),
                    Retries = table.Column<int>(type: "integer", nullable: false),
                    RateLimitPps = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProgressPercent = table.Column<double>(type: "double precision", nullable: false),
                    HostsFound = table.Column<int>(type: "integer", nullable: false),
                    HostsTotal = table.Column<int>(type: "integer", nullable: false),
                    ConfirmedOwnership = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscoveryScans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DiscoverySchedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CronExpression = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TargetCidr = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ScanType = table.Column<string>(type: "text", nullable: false),
                    PortSet = table.Column<string>(type: "text", nullable: true),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    LastRunAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextRunAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscoverySchedules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DiscoveryHosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ScanId = table.Column<Guid>(type: "uuid", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MacAddress = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Vendor = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Hostname = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Ttl = table.Column<int>(type: "integer", nullable: true),
                    OsGuess = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    OpenPortsJson = table.Column<string>(type: "text", nullable: true),
                    BannersJson = table.Column<string>(type: "text", nullable: true),
                    FirstSeenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSeenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Confidence = table.Column<double>(type: "double precision", nullable: false),
                    IsPromoted = table.Column<bool>(type: "boolean", nullable: false),
                    PromotedEndpointId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscoveryHosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiscoveryHosts_DiscoveryScans_ScanId",
                        column: x => x.ScanId,
                        principalTable: "DiscoveryScans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DiscoveryHosts_Endpoints_PromotedEndpointId",
                        column: x => x.PromotedEndpointId,
                        principalTable: "Endpoints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "DiscoveryScanEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ScanId = table.Column<Guid>(type: "uuid", nullable: false),
                    HostId = table.Column<Guid>(type: "uuid", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Severity = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    PayloadJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscoveryScanEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiscoveryScanEvents_DiscoveryHosts_HostId",
                        column: x => x.HostId,
                        principalTable: "DiscoveryHosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DiscoveryScanEvents_DiscoveryScans_ScanId",
                        column: x => x.ScanId,
                        principalTable: "DiscoveryScans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DiscoveryHosts_PromotedEndpointId",
                table: "DiscoveryHosts",
                column: "PromotedEndpointId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscoveryHosts_ScanId_IpAddress",
                table: "DiscoveryHosts",
                columns: new[] { "ScanId", "IpAddress" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiscoveryScanEvents_HostId",
                table: "DiscoveryScanEvents",
                column: "HostId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscoveryScanEvents_ScanId",
                table: "DiscoveryScanEvents",
                column: "ScanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DiscoveryScanEvents");

            migrationBuilder.DropTable(
                name: "DiscoverySchedules");

            migrationBuilder.DropTable(
                name: "DiscoveryHosts");

            migrationBuilder.DropTable(
                name: "DiscoveryScans");
        }
    }
}
