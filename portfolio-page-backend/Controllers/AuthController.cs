using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace PortfolioPageBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var validUsername = _configuration["Authentication:Username"];
        var validPassword = _configuration["Authentication:Password"];

        if (request.Username == validUsername && request.Password == validPassword)
        {
            return Ok(new { success = true });
        }

        return Unauthorized(new { success = false, message = "Invalid credentials" });
    }
}


    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
