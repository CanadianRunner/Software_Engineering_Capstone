using System;
using System.ComponentModel.DataAnnotations;

namespace PortfolioPageBackend.Models
{
    public class Certification
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "Name cannot be longer than 100 characters.")]
        public string Name { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "Issuing body cannot be longer than 100 characters.")]
        public string IssuingBody { get; set; }

        [Required]
        public DateTime DateEarned { get; set; }

        public byte[] ImageData { get; set; }
    }
}
