using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortfolioPageBackend.Data;
using PortfolioPageBackend.Models;

namespace PortfolioPageBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CertificationsController : ControllerBase
    {
        private readonly DatabaseContext _context;

        public CertificationsController(DatabaseContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCertifications()
        {
            var certifications = await _context.Certifications.ToListAsync();

            var certificationsWithImages = certifications.Select(c => new
            {
                c.Id,
                c.Name,
                c.IssuingBody,
                c.DateEarned,
                ImageType = "image/" + (c.ImageData != null && c.ImageData[0] == 0x89 ? "png" : "jpeg"),
                ImageData = c.ImageData != null ? Convert.ToBase64String(c.ImageData) : null
            });

            return Ok(certificationsWithImages);
        }

        [HttpPost]
        public async Task<ActionResult<Certification>> PostCertification([FromForm] Certification certification, IFormFile file)
        {
            if (file != null && file.Length > 0)
            {
                using (var memoryStream = new System.IO.MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    certification.ImageData = memoryStream.ToArray();
                }
            }

            _context.Certifications.Add(certification);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCertifications), new { id = certification.Id }, certification);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCertification(int id, [FromForm] Certification certification, IFormFile file)
        {
            if (id != certification.Id)
            {
                return BadRequest("Certification ID mismatch.");
            }

            if (file != null && file.Length > 0)
            {
                using (var memoryStream = new System.IO.MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    certification.ImageData = memoryStream.ToArray();
                }
            }

            _context.Entry(certification).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CertificationExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCertification(int id)
        {
            var certification = await _context.Certifications.FindAsync(id);
            if (certification == null)
            {
                return NotFound();
            }

            _context.Certifications.Remove(certification);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CertificationExists(int id)
        {
            return _context.Certifications.Any(e => e.Id == id);
        }
    }
}
