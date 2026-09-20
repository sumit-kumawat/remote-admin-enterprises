using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RemoteAdmin.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddKmsAndVolumeActivationModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "KmsHosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Hostname = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Fqdn = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Port = table.Column<int>(type: "integer", nullable: false),
                    OperatingSystem = table.Column<string>(type: "text", nullable: true),
                    ServerVersion = table.Column<string>(type: "text", nullable: true),
                    Environment = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Site = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    LastHealthCheck = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSuccessfulActivationCheck = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResponseLatencyMs = table.Column<int>(type: "integer", nullable: false),
                    LastErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KmsHosts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LicenseComplianceRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalEndpoints = table.Column<int>(type: "integer", nullable: false),
                    WindowsActivatedCount = table.Column<int>(type: "integer", nullable: false),
                    WindowsUnactivatedCount = table.Column<int>(type: "integer", nullable: false),
                    OfficeActivatedCount = table.Column<int>(type: "integer", nullable: false),
                    OfficeUnactivatedCount = table.Column<int>(type: "integer", nullable: false),
                    KmsHostsTotalCount = table.Column<int>(type: "integer", nullable: false),
                    KmsHostsOnlineCount = table.Column<int>(type: "integer", nullable: false),
                    CompliancePercentage = table.Column<decimal>(type: "numeric", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LicenseComplianceRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OfflineTransferPackages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Version = table.Column<string>(type: "text", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    SourceEnvironment = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TargetEnvironment = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SchemaVersion = table.Column<string>(type: "text", nullable: false),
                    PackageHash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Signature = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    RecordCount = table.Column<int>(type: "integer", nullable: false),
                    PackageJsonData = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpirationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ImportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ImportedBy = table.Column<string>(type: "text", nullable: true),
                    RejectionReason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfflineTransferPackages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ActivationPolicies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    ProductFamily = table.Column<int>(type: "integer", nullable: false),
                    DefaultKmsHostId = table.Column<Guid>(type: "uuid", nullable: true),
                    AutoActivateOnDiscovery = table.Column<bool>(type: "boolean", nullable: false),
                    RenewalDaysInterval = table.Column<int>(type: "integer", nullable: false),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    TargetGroupFilter = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivationPolicies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivationPolicies_KmsHosts_DefaultKmsHostId",
                        column: x => x.DefaultKmsHostId,
                        principalTable: "KmsHosts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ActivationRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EndpointId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductFamily = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ProductName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ProductVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Edition = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Channel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ActivationType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ActivationStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PartialProductKey = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    KmsHostId = table.Column<Guid>(type: "uuid", nullable: true),
                    KmsHostAddress = table.Column<string>(type: "text", nullable: true),
                    LastCheckedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ActivationExpiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "text", nullable: true),
                    RawOutputLog = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivationRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivationRecords_Endpoints_EndpointId",
                        column: x => x.EndpointId,
                        principalTable: "Endpoints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivationRecords_KmsHosts_KmsHostId",
                        column: x => x.KmsHostId,
                        principalTable: "KmsHosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ActivationWaves",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    WaveSize = table.Column<int>(type: "integer", nullable: false),
                    TargetProductFamily = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    KmsHostId = table.Column<Guid>(type: "uuid", nullable: true),
                    TotalEndpoints = table.Column<int>(type: "integer", nullable: false),
                    ActivatedCount = table.Column<int>(type: "integer", nullable: false),
                    FailedCount = table.Column<int>(type: "integer", nullable: false),
                    SkippedCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivationWaves", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivationWaves_KmsHosts_KmsHostId",
                        column: x => x.KmsHostId,
                        principalTable: "KmsHosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ActivationWaveItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WaveId = table.Column<Guid>(type: "uuid", nullable: false),
                    EndpointId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    WaveNumber = table.Column<int>(type: "integer", nullable: false),
                    ResultLog = table.Column<string>(type: "text", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivationWaveItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivationWaveItems_ActivationWaves_WaveId",
                        column: x => x.WaveId,
                        principalTable: "ActivationWaves",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivationWaveItems_Endpoints_EndpointId",
                        column: x => x.EndpointId,
                        principalTable: "Endpoints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivationPolicies_DefaultKmsHostId",
                table: "ActivationPolicies",
                column: "DefaultKmsHostId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivationRecords_EndpointId_ProductFamily",
                table: "ActivationRecords",
                columns: new[] { "EndpointId", "ProductFamily" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActivationRecords_KmsHostId",
                table: "ActivationRecords",
                column: "KmsHostId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivationWaveItems_EndpointId",
                table: "ActivationWaveItems",
                column: "EndpointId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivationWaveItems_WaveId",
                table: "ActivationWaveItems",
                column: "WaveId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivationWaves_KmsHostId",
                table: "ActivationWaves",
                column: "KmsHostId");

            migrationBuilder.CreateIndex(
                name: "IX_KmsHosts_Hostname",
                table: "KmsHosts",
                column: "Hostname",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OfflineTransferPackages_PackageId",
                table: "OfflineTransferPackages",
                column: "PackageId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivationPolicies");

            migrationBuilder.DropTable(
                name: "ActivationRecords");

            migrationBuilder.DropTable(
                name: "ActivationWaveItems");

            migrationBuilder.DropTable(
                name: "LicenseComplianceRecords");

            migrationBuilder.DropTable(
                name: "OfflineTransferPackages");

            migrationBuilder.DropTable(
                name: "ActivationWaves");

            migrationBuilder.DropTable(
                name: "KmsHosts");
        }
    }
}
