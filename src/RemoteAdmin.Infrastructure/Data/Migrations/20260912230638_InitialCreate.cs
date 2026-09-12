using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RemoteAdmin.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EndpointGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EndpointGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Salt = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    MustChangePassword = table.Column<bool>(type: "boolean", nullable: false),
                    FailedLoginAttempts = table.Column<int>(type: "integer", nullable: false),
                    LockedUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastLogin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Endpoints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Hostname = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Fqdn = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    MacAddress = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ApprovalStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: true),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Endpoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Endpoints_EndpointGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "EndpointGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "AgentIdentities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EndpointId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AgentVersion = table.Column<string>(type: "text", nullable: true),
                    CertificateThumbprint = table.Column<string>(type: "text", nullable: true),
                    LastHeartbeat = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastInventory = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSuccessfulJob = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastFailedJob = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentIdentities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgentIdentities_Endpoints_EndpointId",
                        column: x => x.EndpointId,
                        principalTable: "Endpoints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DeploymentJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EndpointId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PackageName = table.Column<string>(type: "text", nullable: true),
                    PackageVersion = table.Column<string>(type: "text", nullable: true),
                    CommandLine = table.Column<string>(type: "text", nullable: true),
                    ExitCode = table.Column<int>(type: "integer", nullable: true),
                    Output = table.Column<string>(type: "text", nullable: true),
                    ErrorOutput = table.Column<string>(type: "text", nullable: true),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeploymentJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeploymentJobs_Endpoints_EndpointId",
                        column: x => x.EndpointId,
                        principalTable: "Endpoints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeploymentJobs_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EndpointNetworkInterfaces",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EndpointId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdapterName = table.Column<string>(type: "text", nullable: true),
                    Ipv4Address = table.Column<string>(type: "text", nullable: true),
                    Ipv6Address = table.Column<string>(type: "text", nullable: true),
                    MacAddress = table.Column<string>(type: "text", nullable: true),
                    ConnectionState = table.Column<string>(type: "text", nullable: true),
                    LinkSpeedMbps = table.Column<int>(type: "integer", nullable: true),
                    Gateway = table.Column<string>(type: "text", nullable: true),
                    DnsServers = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EndpointNetworkInterfaces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EndpointNetworkInterfaces_Endpoints_EndpointId",
                        column: x => x.EndpointId,
                        principalTable: "Endpoints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HardwareInventories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EndpointId = table.Column<Guid>(type: "uuid", nullable: false),
                    Manufacturer = table.Column<string>(type: "text", nullable: true),
                    Model = table.Column<string>(type: "text", nullable: true),
                    SerialNumber = table.Column<string>(type: "text", nullable: true),
                    BiosVersion = table.Column<string>(type: "text", nullable: true),
                    ProcessorName = table.Column<string>(type: "text", nullable: true),
                    Cores = table.Column<int>(type: "integer", nullable: true),
                    LogicalProcessors = table.Column<int>(type: "integer", nullable: true),
                    ClockSpeedMhz = table.Column<int>(type: "integer", nullable: true),
                    TotalRamMb = table.Column<long>(type: "bigint", nullable: true),
                    AvailableRamMb = table.Column<long>(type: "bigint", nullable: true),
                    GpuName = table.Column<string>(type: "text", nullable: true),
                    GpuDriverVersion = table.Column<string>(type: "text", nullable: true),
                    Architecture = table.Column<string>(type: "text", nullable: true),
                    InstallDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastBoot = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CollectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HardwareInventories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HardwareInventories_Endpoints_EndpointId",
                        column: x => x.EndpointId,
                        principalTable: "Endpoints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SoftwareInventoryItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EndpointId = table.Column<Guid>(type: "uuid", nullable: false),
                    SoftwareName = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<string>(type: "text", nullable: true),
                    Publisher = table.Column<string>(type: "text", nullable: true),
                    InstallDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Architecture = table.Column<int>(type: "integer", nullable: true),
                    InstallPath = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoftwareInventoryItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoftwareInventoryItems_Endpoints_EndpointId",
                        column: x => x.EndpointId,
                        principalTable: "Endpoints",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StorageDrives",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HardwareInventoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    DriveLetter = table.Column<string>(type: "text", nullable: true),
                    CapacityGb = table.Column<double>(type: "double precision", nullable: true),
                    FreeSpaceGb = table.Column<double>(type: "double precision", nullable: true),
                    UsedSpaceGb = table.Column<double>(type: "double precision", nullable: true),
                    FileSystem = table.Column<string>(type: "text", nullable: true),
                    DiskType = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StorageDrives", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StorageDrives_HardwareInventories_HardwareInventoryId",
                        column: x => x.HardwareInventoryId,
                        principalTable: "HardwareInventories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgentIdentities_EndpointId",
                table: "AgentIdentities",
                column: "EndpointId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeploymentJobs_CreatedByUserId",
                table: "DeploymentJobs",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeploymentJobs_EndpointId",
                table: "DeploymentJobs",
                column: "EndpointId");

            migrationBuilder.CreateIndex(
                name: "IX_EndpointGroups_Name",
                table: "EndpointGroups",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EndpointNetworkInterfaces_EndpointId",
                table: "EndpointNetworkInterfaces",
                column: "EndpointId");

            migrationBuilder.CreateIndex(
                name: "IX_Endpoints_GroupId",
                table: "Endpoints",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Endpoints_Hostname",
                table: "Endpoints",
                column: "Hostname",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HardwareInventories_EndpointId",
                table: "HardwareInventories",
                column: "EndpointId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SoftwareInventoryItems_EndpointId",
                table: "SoftwareInventoryItems",
                column: "EndpointId");

            migrationBuilder.CreateIndex(
                name: "IX_StorageDrives_HardwareInventoryId",
                table: "StorageDrives",
                column: "HardwareInventoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AgentIdentities");

            migrationBuilder.DropTable(
                name: "DeploymentJobs");

            migrationBuilder.DropTable(
                name: "EndpointNetworkInterfaces");

            migrationBuilder.DropTable(
                name: "SoftwareInventoryItems");

            migrationBuilder.DropTable(
                name: "StorageDrives");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "HardwareInventories");

            migrationBuilder.DropTable(
                name: "Endpoints");

            migrationBuilder.DropTable(
                name: "EndpointGroups");
        }
    }
}
