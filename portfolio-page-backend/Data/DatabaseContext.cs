using System;
using Microsoft.EntityFrameworkCore;
using PortfolioPageBackend.Models;

namespace PortfolioPageBackend.Data
{
    public class DatabaseContext : DbContext
    {
        public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options) { }

        public DbSet<Certification> Certifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Certification>().HasData(
                new Certification
                {
                    Id = 1,
                    Name = "Google IT Support Certificate",
                    IssuingBody = "Google Coursera",
                    DateEarned = new DateTime(2020, 5, 15),
                    ImageData = ConvertImageToByteArray("images/certifications/GoogleCoursera.png")
                },
                new Certification
                {
                    Id = 2,
                    Name = "AWS Certified Cloud Practitioner",
                    IssuingBody = "Amazon Web Services",
                    DateEarned = new DateTime(2023, 11, 12),
                    ImageData = ConvertImageToByteArray("images/certifications/AWS_CCP.jpg")
                },
                new Certification
                {
                    Id = 3,
                    Name = "ITIL Foundation 4",
                    IssuingBody = "Axelos",
                    DateEarned = new DateTime(2024, 3, 16),
                    ImageData = ConvertImageToByteArray("images/certifications/ITIL.jpg")
                },
                new Certification
                {
                    Id = 4,
                    Name = "WGU Backend Development Certificate",
                    IssuingBody = "Western Governors University",
                    DateEarned = new DateTime(2024, 8, 13),
                    ImageData = ConvertImageToByteArray("images/certifications/Backend.png")
                },
                new Certification
                {
                    Id = 5,
                    Name = "WGU Frontend Development Certificate",
                    IssuingBody = "Western Governors University",
                    DateEarned = new DateTime(2024, 4, 1),
                    ImageData = ConvertImageToByteArray("images/certifications/Front_End.png")
                },
                new Certification
                {
                    Id = 6,
                    Name = "API Development Certificate",
                    IssuingBody = "Codecademy",
                    DateEarned = new DateTime(2022, 9, 6),
                    ImageData = ConvertImageToByteArray("images/certifications/API_Cert.png")
                },
                new Certification
                {
                    Id = 7,
                    Name = "Learn C# Certificate",
                    IssuingBody = "Codecademy",
                    DateEarned = new DateTime(2022, 8, 28),
                    ImageData = ConvertImageToByteArray("images/certifications/CSharp_cert.png")
                },
                new Certification
                {
                    Id = 8,
                    Name = "Debugging JavaScript Certificate",
                    IssuingBody = "Codecademy",
                    DateEarned = new DateTime(2022, 4, 21),
                    ImageData = ConvertImageToByteArray("images/certifications/Debug_JS_Cert.png")
                },
                new Certification
                {
                    Id = 9,
                    Name = "Learn JavaScript Certificate",
                    IssuingBody = "Codecademy",
                    DateEarned = new DateTime(2022, 4, 20),
                    ImageData = ConvertImageToByteArray("images/certifications/JS_Cert.png")
                },
                new Certification
                {
                    Id = 10,
                    Name = "Learn SQL Certificate",
                    IssuingBody = "Codecademy",
                    DateEarned = new DateTime(2022, 7, 23),
                    ImageData = ConvertImageToByteArray("images/certifications/SQL_Cert.png")
                },
                new Certification
                {
                    Id = 11,
                    Name = "JavaScript Unit Testing Certificate",
                    IssuingBody = "Codecademy",
                    DateEarned = new DateTime(2022, 5, 18),
                    ImageData = ConvertImageToByteArray("images/certifications/Testing_JS_Cert.png")
                }
            );
        }

        private byte[] ConvertImageToByteArray(string path)
        {
            return System.IO.File.ReadAllBytes(path);
        }
    }
}
