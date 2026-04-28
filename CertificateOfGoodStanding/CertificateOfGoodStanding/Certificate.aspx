<%@ Page Title="Certificate of Good Standing" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Certificate.aspx.cs" Inherits="CertificateOfGoodStanding.Certificate" %>

<asp:Content ID="MainContent" ContentPlaceHolderID="MainContent" runat="server">

    <div class="cert-toolbar no-print">
        <asp:HyperLink ID="lnkBack" runat="server" CssClass="btn btn-secondary"
            NavigateUrl="~/Default.aspx" Text="&laquo; Back to Search" />
        <button type="button" class="btn btn-primary" onclick="window.print();">
            Print / Save as PDF
        </button>
    </div>

    <asp:Panel ID="pnlNotFound" runat="server" Visible="false" CssClass="message error">
        The requested student could not be found in the database.
    </asp:Panel>

    <asp:Panel ID="pnlCertificate" runat="server" CssClass="certificate-page">

        <header class="cert-header">
            <div class="cert-logo">
                <img src="<%= ResolveUrl("~/Images/auca-logo.svg") %>" alt="AUCA Logo"
                     onerror="this.onerror=null;this.src='<%= ResolveUrl("~/Images/auca-logo.png") %>';" />
            </div>
            <div class="cert-university">
                <h1><asp:Literal ID="litUniversityName" runat="server" /></h1>
                <p class="cert-address"><asp:Literal ID="litUniversityAddress" runat="server" />
                   &nbsp;|&nbsp; <asp:Literal ID="litUniversityWebsite" runat="server" />
                   &nbsp;|&nbsp; info@auca.ac.rw</p>
                <p class="cert-watermark">Directorate for Admissions and Academic Records</p>
                <p class="cert-contact">
                    Mobile Phone: <asp:Literal ID="litUniversityPhones" runat="server" />
                </p>
                <p class="cert-contact">
                    Email: <asp:Literal ID="litUniversityEmails" runat="server" />
                </p>
            </div>
        </header>

        <hr class="cert-rule" />

        <p class="cert-place-date">
            Kigali, <asp:Literal ID="litIssueDate" runat="server" />
        </p>

        <h2 class="cert-title">CERTIFICATE OF GOOD STANDING</h2>

        <div class="cert-body">
            <p>
                I, the undersigned,
                <strong><asp:Literal ID="litDirectorName" runat="server" /></strong>,
                <asp:Literal ID="litDirectorTitle" runat="server" />
                of the Adventist University of Central Africa, hereby certify that:
            </p>

            <p class="cert-subject">
                <strong><asp:Literal ID="litStudentName" runat="server" /></strong>,
            </p>

            <p>
                Born on <strong><asp:Literal ID="litBornDate" runat="server" /></strong>
            </p>

            <p>
                has been a regular student of this University, registered under ID No.
                <strong><asp:Literal ID="litStudentId" runat="server" /></strong>,
            </p>

            <p>
                From <strong><asp:Literal ID="litStudiedFrom" runat="server" /></strong>
                to <strong><asp:Literal ID="litStudiedTo" runat="server" /></strong>.
            </p>

            <p>Year: <strong><asp:Literal ID="litYear" runat="server" /></strong></p>
            <p>Faculty: <strong><asp:Literal ID="litFaculty" runat="server" /></strong></p>
            <p>Major: <strong><asp:Literal ID="litMajor" runat="server" /></strong></p>
            <p>Academic year: <strong><asp:Literal ID="litAcademicYear" runat="server" /></strong></p>
            <p>Validity: <strong><asp:Literal ID="litValidity" runat="server" /></strong></p>

            <p class="cert-purpose">
                This certificate is issued for any legal or administrative purpose it may serve.
            </p>

            <asp:Panel ID="pnlComment" runat="server" Visible="false" CssClass="cert-comment">
                <em>Comment: <asp:Literal ID="litComment" runat="server" /></em>
            </asp:Panel>
        </div>

        <footer class="cert-footer">
            <div class="cert-signature">
                <div class="cert-sig-line">
                    <span class="cert-sig-mark">______________________________</span>
                </div>
                <p><strong><asp:Literal ID="litApprovedBy" runat="server" /></strong></p>
                <p><strong><asp:Literal ID="litDirectorTitleFooter" runat="server" /></strong></p>
                <p>Adventist University of Central Africa</p>
            </div>
            <div class="cert-qr">
                <div class="qr-placeholder" aria-label="Verification QR code">
                    <span>QR</span>
                </div>
                <p class="cert-qr-caption">Scan to verify<br />my Validity</p>
            </div>
        </footer>
    </asp:Panel>
</asp:Content>
