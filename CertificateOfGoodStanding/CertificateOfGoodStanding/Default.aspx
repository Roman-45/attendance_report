<%@ Page Title="Search Students" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="CertificateOfGoodStanding.Default" %>

<asp:Content ID="MainContent" ContentPlaceHolderID="MainContent" runat="server">
    <section class="search-panel">
        <h1>Generate Certificate of Good Standing</h1>
        <p class="muted">
            Search a student by Student ID or Name, then click <strong>Generate</strong>
            to open the printable certificate.
        </p>

        <div class="search-row">
            <asp:TextBox ID="txtKeyword" runat="server" CssClass="input"
                placeholder="e.g. 2025SEN349 or Tuyizere" />
            <asp:Button ID="btnSearch" runat="server" Text="Search"
                CssClass="btn btn-primary" OnClick="btnSearch_Click" />
            <asp:Button ID="btnClear" runat="server" Text="Clear"
                CssClass="btn btn-secondary" CausesValidation="false"
                OnClick="btnClear_Click" />
        </div>

        <asp:Label ID="lblMessage" runat="server" CssClass="message" Visible="false" />

        <asp:GridView ID="gvStudents" runat="server"
            AutoGenerateColumns="false"
            CssClass="data-grid"
            DataKeyNames="StudentID"
            EmptyDataText="No students found. Try a different search term."
            OnRowCommand="gvStudents_RowCommand">
            <Columns>
                <asp:BoundField DataField="StudentID" HeaderText="Student ID" />
                <asp:BoundField DataField="StudentName" HeaderText="Full Name" />
                <asp:BoundField DataField="Faculty" HeaderText="Faculty" />
                <asp:BoundField DataField="Major" HeaderText="Major" />
                <asp:BoundField DataField="Year" HeaderText="Year" />
                <asp:BoundField DataField="AcademicYear" HeaderText="Academic Year" />
                <asp:BoundField DataField="Status" HeaderText="Status" />
                <asp:TemplateField HeaderText="Action">
                    <ItemTemplate>
                        <asp:LinkButton ID="lnkGenerate" runat="server"
                            CssClass="btn btn-link"
                            CommandName="GenerateCertificate"
                            CommandArgument='<%# Eval("StudentID") %>'
                            Text="Generate" />
                    </ItemTemplate>
                </asp:TemplateField>
            </Columns>
        </asp:GridView>
    </section>
</asp:Content>
