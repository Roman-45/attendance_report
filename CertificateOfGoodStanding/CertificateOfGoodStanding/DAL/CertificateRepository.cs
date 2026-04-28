using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using CertificateOfGoodStanding.Models;

namespace CertificateOfGoodStanding.DAL
{
    public class CertificateRepository
    {
        private readonly string _connectionString;

        public CertificateRepository()
        {
            var setting = ConfigurationManager.ConnectionStrings["AucaDb"];
            if (setting == null || string.IsNullOrWhiteSpace(setting.ConnectionString))
            {
                throw new InvalidOperationException(
                    "Connection string 'AucaDb' is not configured in Web.config.");
            }
            _connectionString = setting.ConnectionString;
        }

        public List<CertificateModel> Search(string keyword)
        {
            var results = new List<CertificateModel>();
            const string sql = @"
                SELECT StudentName, BornDate, StudentID, StudiedFrom, StudiedTo,
                       [Year], Faculty, Major, AcademicYear, ApprovedBy, Comment, Status
                FROM dbo.CertificateOfAttendance
                WHERE (@keyword IS NULL OR @keyword = '')
                   OR StudentID LIKE '%' + @keyword + '%'
                   OR StudentName LIKE '%' + @keyword + '%'
                ORDER BY StudentName;";

            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.Parameters.Add("@keyword", SqlDbType.NVarChar, 255).Value =
                    (object)keyword ?? DBNull.Value;
                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        results.Add(Map(reader));
                    }
                }
            }
            return results;
        }

        public CertificateModel GetByStudentId(string studentId)
        {
            if (string.IsNullOrWhiteSpace(studentId)) return null;

            const string sql = @"
                SELECT TOP 1 StudentName, BornDate, StudentID, StudiedFrom, StudiedTo,
                       [Year], Faculty, Major, AcademicYear, ApprovedBy, Comment, Status
                FROM dbo.CertificateOfAttendance
                WHERE StudentID = @studentId;";

            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.Parameters.Add("@studentId", SqlDbType.NVarChar, 100).Value = studentId;
                conn.Open();
                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Map(reader);
                    }
                }
            }
            return null;
        }

        private static CertificateModel Map(IDataRecord reader)
        {
            return new CertificateModel
            {
                StudentName = GetString(reader, "StudentName"),
                BornDate = GetNullableDateTime(reader, "BornDate"),
                StudentID = GetString(reader, "StudentID"),
                StudiedFrom = GetString(reader, "StudiedFrom"),
                StudiedTo = GetString(reader, "StudiedTo"),
                Year = GetString(reader, "Year"),
                Faculty = GetString(reader, "Faculty"),
                Major = GetString(reader, "Major"),
                AcademicYear = GetString(reader, "AcademicYear"),
                ApprovedBy = GetString(reader, "ApprovedBy"),
                Comment = GetString(reader, "Comment"),
                Status = GetString(reader, "Status")
            };
        }

        private static string GetString(IDataRecord r, string name)
        {
            int idx = r.GetOrdinal(name);
            return r.IsDBNull(idx) ? null : r.GetString(idx);
        }

        private static DateTime? GetNullableDateTime(IDataRecord r, string name)
        {
            int idx = r.GetOrdinal(name);
            return r.IsDBNull(idx) ? (DateTime?)null : r.GetDateTime(idx);
        }
    }
}
