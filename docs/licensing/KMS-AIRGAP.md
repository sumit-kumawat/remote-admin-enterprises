# Air-Gapped Deployment & Transfer Package Workflow

## Air-Gap Isolation Guarantee

The Volume Activation Management Module is designed to operate in 100% air-gapped environments without direct Internet or cloud connectivity.

```
ONLINE/STAGING ENVIRONMENT
|
| controlled export
v
OFFLINE TRANSFER PACKAGE (Cryptographically Signed JSON)
|
v
AIR-GAPPED MANAGEMENT ENVIRONMENT
```

## Security Controls

1. **SHA-256 Hash Verification**: Canonical JSON payload structure hash is calculated upon export.
2. **HMAC-SHA256 Cryptographic Signature**: Signed using host server secrets (`Jwt:Key`).
3. **Expiration Controls**: Configurable package lifetime (default 30 days).
4. **Secret Protection**: Plaintext license keys or credentials are NEVER included in exported package files.
5. **Transactional Import & Audit**: Validation errors or signature mismatches trigger immediate rejection and record an `OfflinePackageRejected` audit log entry.
