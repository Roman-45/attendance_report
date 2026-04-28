using System;
using System.Configuration;
using CertificateOfGoodStanding.DAL;
using CertificateOfGoodStanding.Models;

namespace CertificateOfGoodStanding
{
    public partial class Certificate : System.Web.UI.Page
    {
        private readonly CertificateRepository _repo = new CertificateRepository();

        protected void Page_Load(object sender, EventArgs e)
        {
            if (IsPostBack) return;

            string studentId = Request.QueryString["id"];
            if (string.IsNullOrWhiteSpace(studentId))
            {
                ShowNotFound();
                return;
            }

            CertificateModel model = _repo.GetByStudentId(studentId);
            if (model == null)
            {
                ShowNotFound();
                return;
            }

            Render(model);
        }

        private void Render(CertificateModel model)
        {
            pnlCertificate.Visible = true;
            pnlNotFound.Visible = false;

            litUniversityName.Text = AppSetting("UniversityName");
            litUniversityAddress.Text = AppSetting("UniversityAddress");
            litUniversityWebsite.Text = AppSetting("UniversityWebsite");
            litUniversityPhones.Text = AppSetting("UniversityPhones");
            litUniversityEmails.Text = AppSetting("UniversityEmails");

            litIssueDate.Text = DateTime.Now.ToString("MMMM d, yyyy");

            string directorName = !string.IsNullOrWhiteSpace(model.ApprovedBy)
                ? model.ApprovedBy
                : AppSetting("DirectorName");
            litDirectorName.Text = HtmlEncode(directorName);
            litDirectorTitle.Text = HtmlEncode(AppSetting("DirectorTitle"));
            litDirectorTitleFooter.Text = HtmlEncode(AppSetting("DirectorTitle"));

            litStudentName.Text = HtmlEncode(model.StudentName);
            litBornDate.Text = HtmlEncode(model.FormattedBornDate);
            litStudentId.Text = HtmlEncode(model.StudentID);
            litStudiedFrom.Text = HtmlEncode(model.StudiedFrom);
            litStudiedTo.Text = HtmlEncode(model.StudiedTo);
            litYear.Text = HtmlEncode(model.Year);
            litFaculty.Text = HtmlEncode(model.Faculty);
            litMajor.Text = HtmlEncode(model.Major);
            litAcademicYear.Text = HtmlEncode(model.AcademicYear);
            litValidity.Text = HtmlEncode(model.Validity);
            litApprovedBy.Text = HtmlEncode(directorName);

            if (!string.IsNullOrWhiteSpace(model.Comment))
            {
                litComment.Text = HtmlEncode(model.Comment);
                pnlComment.Visible = true;
            }
        }

        private void ShowNotFound()
        {
            pnlCertificate.Visible = false;
            pnlNotFound.Visible = true;
        }

        private static string AppSetting(string key)
        {
            return ConfigurationManager.AppSettings[key] ?? string.Empty;
        }

        private static string HtmlEncode(string value)
        {
            return string.IsNullOrEmpty(value) ? string.Empty : System.Web.HttpUtility.HtmlEncode(value);
        }
    }
}
