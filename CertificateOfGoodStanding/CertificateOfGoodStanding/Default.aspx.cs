using System;
using System.Web.UI.WebControls;
using CertificateOfGoodStanding.DAL;

namespace CertificateOfGoodStanding
{
    public partial class Default : System.Web.UI.Page
    {
        private readonly CertificateRepository _repo = new CertificateRepository();

        protected void Page_Load(object sender, EventArgs e)
        {
            if (!IsPostBack)
            {
                BindGrid(string.Empty);
            }
        }

        protected void btnSearch_Click(object sender, EventArgs e)
        {
            BindGrid((txtKeyword.Text ?? string.Empty).Trim());
        }

        protected void btnClear_Click(object sender, EventArgs e)
        {
            txtKeyword.Text = string.Empty;
            BindGrid(string.Empty);
        }

        protected void gvStudents_RowCommand(object sender, GridViewCommandEventArgs e)
        {
            if (!string.Equals(e.CommandName, "GenerateCertificate", StringComparison.Ordinal))
            {
                return;
            }

            string studentId = Convert.ToString(e.CommandArgument);
            if (string.IsNullOrWhiteSpace(studentId))
            {
                ShowMessage("Invalid student selected.", true);
                return;
            }

            Response.Redirect("~/Certificate.aspx?id=" + Server.UrlEncode(studentId), false);
            Context.ApplicationInstance.CompleteRequest();
        }

        private void BindGrid(string keyword)
        {
            try
            {
                var rows = _repo.Search(keyword);
                gvStudents.DataSource = rows;
                gvStudents.DataBind();

                if (!string.IsNullOrEmpty(keyword) && rows.Count == 0)
                {
                    ShowMessage("No students matched \"" + Server.HtmlEncode(keyword) + "\".", false);
                }
                else
                {
                    lblMessage.Visible = false;
                }
            }
            catch (Exception ex)
            {
                ShowMessage("Could not load students: " + ex.Message, true);
            }
        }

        private void ShowMessage(string text, bool isError)
        {
            lblMessage.Text = text;
            lblMessage.CssClass = isError ? "message error" : "message info";
            lblMessage.Visible = true;
        }
    }
}
