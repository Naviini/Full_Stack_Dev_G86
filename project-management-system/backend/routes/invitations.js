const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const { sendInvitationEmail } = require('../services/emailService');

// Helper function to generate invitation token
const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Invite member to project
router.post('/project/:projectId/invite', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role, message } = req.body;
    const inviterId = req.user.user.id;

    // Validate input
    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized (owner or admin)
    const isOwner = project.owner.toString() === inviterId;
    const isAdmin = project.members.some(m => m.user.toString() === inviterId && m.role === 'admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to invite members' });
    }

    // Check if email is already a member
    const existingMember = project.members.find(m => m.user && m.user.email === email);
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({
      project: projectId,
      invitedEmail: email.toLowerCase(),
      status: 'pending',
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent to this email' });
    }

    // Check if user exists
    const invitedUser = await User.findOne({ email: email.toLowerCase() });

    // Create invitation
    const invitationToken = generateInvitationToken();
    const invitation = new Invitation({
      project: projectId,
      inviter: inviterId,
      invitedEmail: email.toLowerCase(),
      invitedUser: invitedUser ? invitedUser._id : null,
      role,
      message: message || '',
      invitationToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await invitation.save();
    await invitation.populate('project', 'name');
    await invitation.populate('inviter', 'name email');

    // Send invitation email
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/invitations/${invitation._id}/${invitation.invitationToken}`;
    const emailResult = await sendInvitationEmail(
      invitation.invitedEmail,
      invitation.project.name,
      invitation.inviter.name || 'A colleague',
      invitationLink,
      message
    );

    // Log email result but don't fail the request if email fails
    if (!emailResult.success) {
      console.warn('Email sending failed but invitation was created:', emailResult.error);
    } else {
      console.log('Invitation email sent successfully');
      if (emailResult.previewUrl) {
        console.log('Test email preview:', emailResult.previewUrl);
      }
    }

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation,
      emailSent: emailResult.success,
      testEmailPreview: emailResult.previewUrl,
    });
  } catch (error) {
    console.error('Invitation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending invitations for a project
router.get('/project/:projectId/invitations', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.user.id;

    // Check if user is authorized
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some(m => m.user.toString() === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const invitations = await Invitation.find({
      project: projectId,
    })
      .populate('inviter', 'name email')
      .populate('invitedUser', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get invitations for current user
router.get('/my-invitations', auth, async (req, res) => {
  try {
    const userId = req.user.user.id;
    const userEmail = req.user.user.email;

    const invitations = await Invitation.find({
      $or: [
        { invitedUser: userId },
        { invitedEmail: userEmail.toLowerCase() },
      ],
      status: { $in: ['pending', 'accepted', 'rejected'] },
    })
      .populate('project', 'name description')
      .populate('inviter', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept invitation
router.post('/invitations/:invitationId/accept', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.user.id;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if invitation is valid
    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'This invitation is no longer valid' });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    // Check if user is the intended recipient
    if (
      invitation.invitedUser?.toString() !== userId &&
      invitation.invitedEmail !== req.user.user.email.toLowerCase()
    ) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    // Add user to project
    const project = await Project.findById(invitation.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if already a member
    const isMember = project.members.some(m => m.user.toString() === userId);
    if (!isMember) {
      project.members.push({
        user: userId,
        role: invitation.role,
      });
      await project.save();
    }

    // Update invitation
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    invitation.invitedUser = userId;
    await invitation.save();

    await invitation.populate('project', 'name');
    await invitation.populate('inviter', 'name email');

    res.json({
      message: 'Invitation accepted successfully',
      invitation,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject invitation
router.post('/invitations/:invitationId/reject', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.user.id;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check if user is the intended recipient
    if (
      invitation.invitedUser?.toString() !== userId &&
      invitation.invitedEmail !== req.user.user.email.toLowerCase()
    ) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    invitation.status = 'rejected';
    invitation.respondedAt = new Date();
    await invitation.save();

    res.json({ message: 'Invitation rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel invitation (by project admin/owner)
router.post('/invitations/:invitationId/cancel', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.user.id;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check authorization
    const project = await Project.findById(invitation.project);
    const isOwner = project.owner.toString() === userId;
    const isAdmin = project.members.some(m => m.user.toString() === userId && m.role === 'admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Invitation.findByIdAndDelete(invitationId);

    res.json({ message: 'Invitation cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend invitation
router.post('/invitations/:invitationId/resend', auth, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.user.id;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Check authorization
    const project = await Project.findById(invitation.project);
    const isOwner = project.owner.toString() === userId;
    const isAdmin = project.members.some(m => m.user.toString() === userId && m.role === 'admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Can only resend pending invitations' });
    }

    // Update expiration date
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    invitation.invitationToken = generateInvitationToken();
    await invitation.save();
    await invitation.populate('inviter', 'name email');

    // Resend invitation email
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/invitations/${invitation._id}/${invitation.invitationToken}`;
    const emailResult = await sendInvitationEmail(
      invitation.invitedEmail,
      project.name,
      invitation.inviter.name || 'A colleague',
      invitationLink,
      invitation.message
    );

    if (!emailResult.success) {
      console.warn('Resend email failed:', emailResult.error);
    } else {
      console.log('Invitation email resent successfully');
    }

    res.json({ 
      message: 'Invitation resent successfully', 
      invitation,
      emailSent: emailResult.success,
      testEmailPreview: emailResult.previewUrl,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from project
router.post('/project/:projectId/members/:userId/remove', auth, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const requesterId = req.user.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization
    const isOwner = project.owner.toString() === requesterId;
    const isAdmin = project.members.some(m => m.user.toString() === requesterId && m.role === 'admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Cannot remove owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    // Remove member
    project.members = project.members.filter(m => m.user.toString() !== userId);
    await project.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update member role
router.put('/project/:projectId/members/:userId/role', auth, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;
    const requesterId = req.user.user.id;

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check authorization
    const isOwner = project.owner.toString() === requesterId;
    const isAdmin = project.members.some(m => m.user.toString() === requesterId && m.role === 'admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Cannot change owner's role
    if (project.owner.toString() === userId) {
      return res.status(400).json({ message: 'Cannot change project owner role' });
    }

    // Update role
    const member = project.members.find(m => m.user.toString() === userId);
    if (member) {
      member.role = role;
      await project.save();
    }

    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
