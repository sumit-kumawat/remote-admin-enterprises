using Microsoft.AspNetCore.Mvc;

namespace RemoteAdmin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    [HttpGet("info")]
    public IActionResult GetInfo()
    {
        return Ok(new
        {
            Product = "Remote Admin Enterprises",
            Version = "v1.0",
            Author = "Sumit Kumawat",
            Website = "https://www.sumitkumawat.com",
            Support = "hello@sumitkumawat.com",
            ServerTime = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
        });
    }
}
